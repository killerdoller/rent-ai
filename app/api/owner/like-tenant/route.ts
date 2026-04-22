import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// POST /api/owner/like-tenant
// El propietario acepta un arrendatario → el trigger en BD crea el match automáticamente
export async function POST(request: Request) {
  const body = await request.json();
  const { owner_id, user_id, property_id } = body;

  if (!owner_id || !user_id || !property_id) {
    return NextResponse.json(
      { error: "owner_id, user_id y property_id requeridos" },
      { status: 400 }
    );
  }

  const { data, error } = await supabase
    .from("owner_tenant_likes")
    .insert({ owner_id, user_id, property_id })
    .select()
    .single();

  if (error) {
    if (error.code === "23505") {
      return NextResponse.json({ message: "Ya aceptaste a este arrendatario" }, { status: 200 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Verificar si se creó el match (el trigger lo hace automáticamente)
  const { data: match } = await supabase
    .from("property_matches")
    .select("id")
    .eq("user_id", user_id)
    .eq("property_id", property_id)
    .eq("owner_id", owner_id)
    .single();

  return NextResponse.json({
    ...data,
    match_created: !!match,
    match_id: match?.id,
  }, { status: 201 });
}
