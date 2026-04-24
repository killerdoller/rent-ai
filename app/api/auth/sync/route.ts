import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  return createClient(url, key);
}

// POST { user_id, email, first_name?, last_name?, avatar_url?, mode?, role? }
// Returns { role, profile_id, email?, is_new }
export async function POST(request: Request) {
  const supabase = getSupabase();
  const { user_id, email, first_name, last_name, avatar_url, mode, role } = await request.json();

  if (!user_id) {
    return NextResponse.json({ error: "user_id requerido" }, { status: 400 });
  }

  // Check if this user is already an owner (by auth_user_id or email)
  const { data: ownerByAuth } = await supabase
    .from("owners")
    .select("owner_id, email")
    .eq("auth_user_id", user_id)
    .maybeSingle();

  if (ownerByAuth) {
    return NextResponse.json({ role: "owner", profile_id: ownerByAuth.owner_id, email: ownerByAuth.email, is_new: false });
  }

  // Check if profile exists for this user
  const { data: profile } = await supabase
    .from("profiles")
    .select("id, user_mode, profile_completed")
    .eq("id", user_id)
    .maybeSingle();

  if (profile && role !== "owner") {
    if (profile.profile_completed) {
      return NextResponse.json({ role: "student", profile_id: profile.id, is_new: false });
    }
    // Profile exists but onboarding not done — update metadata and send to complete-profile
    await supabase.from("profiles").update({
      ...(first_name ? { first_name } : {}),
      ...(last_name  ? { last_name  } : {}),
      ...(avatar_url ? { avatar_url } : {}),
      user_mode: mode || "find-room",
    }).eq("id", user_id);
    return NextResponse.json({ role: "student", profile_id: profile.id, is_new: true });
  }

  // New user — determine role and create records
  const effectiveRole = role || "student";

  if (effectiveRole === "owner") {
    // Find existing owner by email first (handles cases where owner existed before Supabase Auth)
    const { data: existingOwner } = await supabase
      .from("owners")
      .select("owner_id, email")
      .eq("email", (email || "").toLowerCase())
      .maybeSingle();

    if (existingOwner) {
      // Link the auth user to the existing owner record
      await supabase
        .from("owners")
        .update({ auth_user_id: user_id })
        .eq("owner_id", existingOwner.owner_id);
      // Mark the trigger-created profiles row as landlord to avoid confusion
      await supabase.from("profiles").update({ user_mode: "landlord" }).eq("id", user_id);
      return NextResponse.json({ role: "owner", profile_id: existingOwner.owner_id, email: existingOwner.email, is_new: false });
    }

    // Create new owner
    const ownerName = `${first_name || ""} ${last_name || ""}`.trim() || email?.split("@")[0] || "Propietario";
    const { data: newOwner, error } = await supabase
      .from("owners")
      .insert({ name: ownerName, email: (email || "").toLowerCase(), auth_user_id: user_id })
      .select("owner_id")
      .single();

    if (error || !newOwner) {
      return NextResponse.json({ error: error?.message || "Error creando propietario" }, { status: 500 });
    }
    // Mark the trigger-created profiles row as landlord to avoid confusion
    await supabase.from("profiles").update({ user_mode: "landlord" }).eq("id", user_id);
    return NextResponse.json({ role: "owner", profile_id: newOwner.owner_id, email, is_new: true });
  }

  // Student / roommate — profile was created by trigger, just update it
  if (profile) {
    await supabase.from("profiles").update({
      first_name: first_name || undefined,
      last_name:  last_name  || undefined,
      avatar_url: avatar_url || undefined,
      user_mode:  mode       || undefined,
    }).eq("id", user_id);
    return NextResponse.json({ role: "student", profile_id: user_id, is_new: false });
  }

  // Profile doesn't exist yet (trigger may not have fired or demo user)
  const { error } = await supabase.from("profiles").insert({
    id:         user_id,
    email:      email      || "",
    first_name: first_name || "",
    last_name:  last_name  || "",
    avatar_url: avatar_url || "",
    user_mode:  mode       || "find-room",
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ role: "student", profile_id: user_id, is_new: true });
}
