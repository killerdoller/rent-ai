import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// GET /api/owner/interested?owner_id=xxx
// Retorna los arrendatarios que dieron like a las propiedades del propietario,
// filtrando los que ya tienen match o rechazo.
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const ownerId = searchParams.get("owner_id");

  if (!ownerId) {
    return NextResponse.json({ error: "owner_id requerido" }, { status: 400 });
  }

  // 1. Obtener propiedades del propietario
  const { data: properties, error: propError } = await supabase
    .from("properties")
    .select("property_id, title, image_url, neighborhood, city")
    .eq("owner_id", ownerId);

  if (propError) {
    return NextResponse.json({ error: propError.message }, { status: 500 });
  }

  if (!properties || properties.length === 0) {
    return NextResponse.json([]);
  }

  const propertyIds = properties.map((p: any) => p.property_id);

  // 2. Obtener likes de arrendatarios en esas propiedades
  const { data: likes, error: likesError } = await supabase
    .from("property_likes")
    .select("id, user_id, property_id, created_at")
    .in("property_id", propertyIds)
    .order("created_at", { ascending: false });

  if (likesError) {
    return NextResponse.json({ error: likesError.message }, { status: 500 });
  }

  // 3. Obtener IDs que ya tienen match (para excluirlos de "interesados")
  const { data: existingMatches } = await supabase
    .from("property_matches")
    .select("user_id, property_id")
    .eq("owner_id", ownerId);

  const matchedPairs = new Set(
    (existingMatches || []).map((m: any) => `${m.user_id}_${m.property_id}`)
  );

  // 4. Obtener info de los arrendatarios (guest_users)
  const userIds = [...new Set((likes || []).map((l: any) => l.user_id))];
  const { data: guestUsers } = userIds.length > 0
    ? await supabase.from("guest_users").select("id, name, email, phone, user_mode").in("id", userIds)
    : { data: [] };

  const usersMap = Object.fromEntries((guestUsers || []).map((u: any) => [u.id, u]));
  const propertiesMap = Object.fromEntries(properties.map((p: any) => [p.property_id, p]));

  const interested = (likes || [])
    .filter((l: any) => !matchedPairs.has(`${l.user_id}_${l.property_id}`))
    .map((l: any) => ({
      like_id: l.id,
      user_id: l.user_id,
      liked_at: l.created_at,
      tenant: usersMap[l.user_id] || null,
      property: propertiesMap[l.property_id],
    }));

  return NextResponse.json(interested);
}
