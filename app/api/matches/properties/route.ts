import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// Service role client — bypasses RLS, used when user_id is passed from client
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get("user_id");

  if (!userId) {
    return NextResponse.json({ error: "user_id is required" }, { status: 400 });
  }

  try {
    // 1. Llama a la función RPC que calcula el match geoespacial y devuelve los property_ids con score
    const { data: matches, error: rpcError } = await supabaseAdmin.rpc("match_properties", {
      p_user_id: userId,
    });

    if (rpcError) {
      console.error("RPC match_properties error:", rpcError);
      return NextResponse.json({ error: rpcError.message }, { status: 500 });
    }

    if (!matches || matches.length === 0) {
      return NextResponse.json([]);
    }

    // 2. Extraer los IDs para traer los detalles de las propiedades
    const propertyIds = matches.map((m: any) => m.property_id);

    // 3. Consultar las propiedades completas (para la UI)
    let query = supabaseAdmin
      .from("properties")
      .select(`
        property_id,
        owner_id,
        title,
        description,
        monthly_rent,
        city,
        address,
        image_url,
        images,
        property_type,
        bathrooms,
        area_sqm,
        stratum,
        amenities_interior,
        amenities_exterior,
        amenities_sector
      `)
      .in("property_id", propertyIds);

    // Obtener presupuesto del perfil para forzar el filtro
    const { data: profile } = await supabaseAdmin
      .from("profiles")
      .select("min_budget, max_budget, monthly_budget")
      .eq("id", userId)
      .single();

    if (profile) {
      const maxB = profile.max_budget || profile.monthly_budget;
      const minB = profile.min_budget;
      if (maxB) {
        query = query.lte("monthly_rent", maxB);
      }
      if (minB) {
        query = query.gte("monthly_rent", minB);
      }
    }

    const { data: properties, error: propertiesError } = await query;

    if (propertiesError) {
      return NextResponse.json({ error: propertiesError.message }, { status: 500 });
    }

    // 4. Mapear para incluir el match_score calculado en la base de datos
    const propertiesWithScore = properties.map((prop) => {
      const matchData = matches.find((m: any) => m.property_id === prop.property_id);
      return {
        ...prop,
        id: prop.property_id,
        type: "room",
        price: prop.monthly_rent,
        image: prop.image_url || "https://images.unsplash.com/photo-1611234688667-76b6d8fadd75?w=1080",
        images: prop.images && prop.images.length > 0 ? prop.images : (prop.image_url ? [prop.image_url] : []),
        matchScore: matchData ? matchData.match_score_percentage : 0,
        distanceMeters: matchData ? matchData.distance_meters : null,
      };
    });

    // Ordenar de mayor a menor score
    propertiesWithScore.sort((a, b) => b.matchScore - a.matchScore);

    return NextResponse.json(propertiesWithScore);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
