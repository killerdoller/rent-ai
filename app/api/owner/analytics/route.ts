import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// Inicializar cliente de Supabase con Service Role para cálculos globales de mercado
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const ownerId = searchParams.get("ownerId");
  const propertyId = searchParams.get("propertyId");

  if (!ownerId) {
    return NextResponse.json({ error: "ownerId es requerido" }, { status: 400 });
  }

  try {
    // 1. Obtener IDs de las propiedades del dueño (o una específica)
    let propertiesQuery = supabaseAdmin
      .from("properties")
      .select("property_id, monthly_rent")
      .eq("owner_id", ownerId);
    
    if (propertyId) {
      propertiesQuery = propertiesQuery.eq("property_id", propertyId);
    }
    
    const { data: ownerProps } = await propertiesQuery;
    if (!ownerProps || ownerProps.length === 0) {
      return NextResponse.json({ funnel: [], radar: [], market: { yourPrice: 0, avgPrice: 0 } });
    }

    const propIds = ownerProps.map(p => p.property_id);

    // 2. Cálculo del Funnel (Likes y Matches)
    const { data: likesData } = await supabaseAdmin
      .from("property_likes")
      .select("user_id")
      .in("property_id", propIds);

    const { count: totalMatches } = await supabaseAdmin
      .from("property_matches")
      .select("*", { count: 'exact', head: true })
      .in("property_id", propIds);

    const totalLikes = likesData?.length || 0;

    // 3. Análisis Psicográfico (Radar Chart)
    // Debido a que falta la FK en property_likes, obtenemos los perfiles en un segundo paso
    const userIds = [...new Set((likesData || []).map(l => l.user_id))];
    
    let profiles: any[] = [];
    if (userIds.length > 0) {
      const { data: profilesData } = await supabaseAdmin
        .from("profiles")
        .select("cleanliness_level, social_level, monthly_budget")
        .in("id", userIds);
      profiles = profilesData || [];
    }
    
    const calculateAvg = (arr: any[], key: string) => 
      arr.length > 0 ? arr.reduce((acc, p) => acc + (Number(p[key]) || 0), 0) / arr.length : 0;

    const avgStats = {
      limpieza: calculateAvg(profiles, 'cleanliness_level'),
      social: calculateAvg(profiles, 'social_level'),
      presupuesto: (calculateAvg(profiles, 'monthly_budget') / 3000000) * 10,
    };

    // 4. Análisis de Mercado
    const { data: marketData } = await supabaseAdmin
      .from("properties")
      .select("monthly_rent");
    
    const allPrices = (marketData || []).map(p => Number(p.monthly_rent)).filter(p => p > 0);
    const avgMarketPrice = allPrices.length > 0 
      ? allPrices.reduce((acc, p) => acc + p, 0) / allPrices.length 
      : 0;

    return NextResponse.json({
      funnel: [
        { name: 'Vistas', value: totalLikes * 4, fill: '#8884d8' },
        { name: 'Likes', value: totalLikes, fill: '#83a6ed' },
        { name: 'Matches', value: totalMatches || 0, fill: '#8dd1e1' }
      ],
      radar: [
        { subject: 'Limpieza', A: avgStats.limpieza, fullMark: 10 },
        { subject: 'Social', A: avgStats.social, fullMark: 10 },
        { subject: 'Presupuesto', A: avgStats.presupuesto, fullMark: 10 },
      ],
      market: {
        yourPrice: Number(ownerProps[0]?.monthly_rent) || 0,
        avgPrice: Math.round(avgMarketPrice)
      }
    });

  } catch (error: any) {
    console.error("Analytics Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
