import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { randomUUID } from "crypto";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// POST { clerk_id, email, first_name?, mode?, role? }
// Returns { role, profile_id, email?, is_new }
export async function POST(request: Request) {
  const { clerk_id, email, first_name, mode, role } = await request.json();

  if (!clerk_id) {
    return NextResponse.json({ error: "clerk_id requerido" }, { status: 400 });
  }

  // 1. Check owners table
  const { data: owner } = await supabase
    .from("owners")
    .select("owner_id, email")
    .eq("clerk_id", clerk_id)
    .maybeSingle();

  if (owner) {
    return NextResponse.json({ role: "owner", profile_id: owner.owner_id, email: owner.email, is_new: false });
  }

  // 2. Check profiles table
  const { data: profile } = await supabase
    .from("profiles")
    .select("id, user_mode")
    .eq("clerk_id", clerk_id)
    .maybeSingle();

  if (profile) {
    return NextResponse.json({ role: "student", profile_id: profile.id, is_new: false });
  }

  // 3. New user — create based on role
  if (role === "owner") {
    const { data: newOwner, error } = await supabase
      .from("owners")
      .insert({
        name: first_name || email?.split("@")[0] || "Propietario",
        email: email || "",
        clerk_id,
      })
      .select("owner_id")
      .single();

    if (error || !newOwner) {
      return NextResponse.json({ error: error?.message || "Error creando propietario" }, { status: 500 });
    }
    return NextResponse.json({ role: "owner", profile_id: newOwner.owner_id, email, is_new: true });
  }

  // Default: student profile
  const newId = randomUUID();
  const { error } = await supabase.from("profiles").insert({
    id: newId,
    clerk_id,
    first_name: first_name || "",
    user_mode: mode || "find-room",
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ role: "student", profile_id: newId, is_new: true });
}
