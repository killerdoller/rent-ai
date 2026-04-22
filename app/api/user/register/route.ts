import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// POST /api/user/register — crea o actualiza un arrendatario demo
export async function POST(request: Request) {
  const body = await request.json();
  const { id, name, email, phone, user_mode } = body;

  if (!name) {
    return NextResponse.json({ error: "nombre requerido" }, { status: 400 });
  }

  // Si viene un ID, actualizar el registro existente
  if (id) {
    const { data, error } = await supabase
      .from("guest_users")
      .upsert({ id, name, email, phone, user_mode }, { onConflict: "id" })
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(data);
  }

  // Crear nuevo registro
  const { data, error } = await supabase
    .from("guest_users")
    .insert({ name, email, phone, user_mode })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data, { status: 201 });
}
