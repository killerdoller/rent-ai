import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// GET /api/likes?user_id=xxx — propiedades que le dieron like
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get("user_id");

  if (!userId) {
    return NextResponse.json({ error: "user_id requerido" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("property_likes")
    .select(`
      id,
      created_at,
      property_id,
      properties (
        property_id,
        title,
        monthly_rent,
        neighborhood,
        city,
        bedrooms,
        image_url,
        description,
        tags,
        address,
        latitude,
        longitude
      )
    `)
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}

// POST /api/likes — arrendatario da like a una propiedad
export async function POST(request: Request) {
  const body = await request.json();
  const { user_id, property_id } = body;

  if (!user_id || !property_id) {
    return NextResponse.json({ error: "user_id y property_id requeridos" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("property_likes")
    .insert({ user_id, property_id })
    .select()
    .single();

  if (error) {
    // Si ya existe el like, no es un error crítico
    if (error.code === "23505") {
      return NextResponse.json({ message: "Ya existe el like" }, { status: 200 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data, { status: 201 });
}
