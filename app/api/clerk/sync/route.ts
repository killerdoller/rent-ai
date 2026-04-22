import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { randomUUID } from "crypto";

function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("Supabase env vars not configured");
  return createClient(url, key);
}

// POST { clerk_id, email, first_name?, mode?, role? }
// Returns { role, profile_id, email?, is_new }
export async function POST(request: Request) {
  const supabase = getSupabase();
  const { clerk_id, email, first_name, last_name, avatar_url, mode, role } = await request.json();

  if (!clerk_id) {
    return NextResponse.json({ error: "clerk_id requerido" }, { status: 400 });
  }

  // 1 & 2. Check owners and profiles in parallel for speed
  const [ownerRes, profileRes] = await Promise.all([
    supabase.from("owners").select("owner_id, email").eq("clerk_id", clerk_id).maybeSingle(),
    supabase.from("profiles").select("id, user_mode").eq("clerk_id", clerk_id).maybeSingle()
  ]);

  if (ownerRes.data) {
    return NextResponse.json({ role: "owner", profile_id: ownerRes.data.owner_id, email: ownerRes.data.email, is_new: false });
  }

  if (profileRes.data) {
    return NextResponse.json({ role: "student", profile_id: profileRes.data.id, is_new: false });
  }

  // 3. New user — create based on role
  if (!role) {
    return NextResponse.json({ needs_role: true });
  }

  if (role === "owner") {
    const { data: newOwner, error } = await supabase
      .from("owners")
      .insert({
        name: `${first_name || ""} ${last_name || ""}`.trim() || email?.split("@")[0] || "Propietario",
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
    email: email || "",
    first_name: first_name || "",
    last_name: last_name || "",
    avatar_url: avatar_url || "",
    user_mode: mode || "find-room",
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ role: "student", profile_id: newId, is_new: true });
}
