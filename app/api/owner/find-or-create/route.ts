import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// POST /api/owner/find-or-create — busca o crea un propietario por email
export async function POST(request: Request) {
  const body = await request.json();
  const { email } = body;

  if (!email) {
    return NextResponse.json({ error: "email requerido" }, { status: 400 });
  }

  // Buscar propietario existente
  const { data: existing } = await supabase
    .from("owners")
    .select("owner_id, name, email, phone")
    .eq("email", email.toLowerCase())
    .single();

  if (existing) {
    return NextResponse.json(existing);
  }

  // Crear nuevo propietario
  const name = email.split("@")[0];
  const { data: created, error } = await supabase
    .from("owners")
    .insert({ email: email.toLowerCase(), name })
    .select("owner_id, name, email, phone")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(created, { status: 201 });
}
