import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// POST /api/rejections — arrendatario pasa (swipe left) en una propiedad
export async function POST(request: Request) {
  const body = await request.json();
  const { user_id, property_id } = body;

  if (!user_id || !property_id) {
    return NextResponse.json({ error: "user_id y property_id requeridos" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("property_rejections")
    .insert({ user_id, property_id })
    .select()
    .single();

  if (error) {
    if (error.code === "23505") {
      return NextResponse.json({ message: "Ya existe el rechazo" }, { status: 200 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data, { status: 201 });
}

// DELETE /api/rejections?user_id=xxx — borrar historial (solo para demo)
export async function DELETE(request: Request) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get("user_id");

  if (!userId) {
    return NextResponse.json({ error: "user_id requerido" }, { status: 400 });
  }

  const { error } = await supabase
    .from("property_rejections")
    .delete()
    .eq("user_id", userId);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
