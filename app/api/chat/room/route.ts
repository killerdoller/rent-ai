import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// GET /api/chat/room?match_id=xxx&caller_type=user|owner
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const matchId    = searchParams.get("match_id");
  const callerId   = searchParams.get("caller_id");
  const callerType = searchParams.get("caller_type") as "user" | "owner" | null;

  if (!matchId) {
    return NextResponse.json({ error: "match_id requerido" }, { status: 400 });
  }

  // --- Try property match first ---
  const { data: propMatch } = await supabase
    .from("property_matches")
    .select("id, user_id, property_id, owner_id, created_at")
    .eq("id", matchId)
    .maybeSingle();

  if (propMatch) {
    let { data: conv } = await supabase
      .from("conversations")
      .select("id")
      .eq("property_match_id", matchId)
      .maybeSingle();

    if (!conv) {
      const { data: newConv, error: convErr } = await supabase
        .from("conversations")
        .insert({ property_match_id: matchId })
        .select("id")
        .single();
      if (convErr || !newConv) return NextResponse.json({ error: "Error creando conversación" }, { status: 500 });
      conv = newConv;
    }

    const { data: property } = await supabase
      .from("properties")
      .select("property_id, title, image_url, neighborhood, city, monthly_rent")
      .eq("property_id", propMatch.property_id)
      .maybeSingle();

    let otherParty = { name: "Usuario", avatar: null as string | null };
    if (callerType === "user") {
      const { data: owner } = await supabase
        .from("owners").select("owner_id, name").eq("owner_id", propMatch.owner_id).maybeSingle();
      if (owner) otherParty = { name: owner.name, avatar: null };
    } else {
      const { data: profile } = await supabase
        .from("profiles").select("id, first_name, last_name, avatar_url").eq("id", propMatch.user_id).maybeSingle();
      if (profile) {
        otherParty = { name: [profile.first_name, profile.last_name].filter(Boolean).join(" ") || "Arrendatario", avatar: profile.avatar_url };
      } else {
        const { data: guest } = await supabase
          .from("guest_users").select("id, name").eq("id", propMatch.user_id).maybeSingle();
        if (guest) otherParty = { name: guest.name || "Arrendatario", avatar: null };
      }
    }

    const { data: messages } = await supabase
      .from("messages").select("id, sender_id, sender_type, content, created_at")
      .eq("conversation_id", conv.id).order("created_at", { ascending: true }).limit(100);

    // other_user_id only for tenant profiles (not owners)
    const otherUserId = callerType === "user" ? null : propMatch.user_id;
    return NextResponse.json({ conversation_id: conv.id, property: property || null, other_party: otherParty, other_user_id: otherUserId, messages: messages || [] });
  }

  // --- Try roommate match ---
  const { data: rmMatch } = await supabase
    .from("roommate_matches")
    .select("match_id, student_1_id, student_2_id, created_at")
    .eq("match_id", matchId)
    .maybeSingle();

  if (!rmMatch) {
    return NextResponse.json({ error: "Match no encontrado" }, { status: 404 });
  }

  let { data: conv } = await supabase
    .from("conversations")
    .select("id")
    .eq("roommate_match_id", matchId)
    .maybeSingle();

  if (!conv) {
    const { data: newConv, error: convErr } = await supabase
      .from("conversations")
      .insert({ roommate_match_id: matchId })
      .select("id")
      .single();
    if (convErr || !newConv) return NextResponse.json({ error: "Error creando conversación" }, { status: 500 });
    conv = newConv;
  }

  // The "other" person is whichever student is not the caller
  const otherStudentId = callerId
    ? (rmMatch.student_1_id.toLowerCase() === callerId.toLowerCase() ? rmMatch.student_2_id : rmMatch.student_1_id)
    : rmMatch.student_2_id;

  const { data: otherProfile } = await supabase
    .from("profiles")
    .select("id, first_name, last_name, profile_images")
    .eq("id", otherStudentId)
    .maybeSingle();

  const otherParty = {
    name: otherProfile
      ? [otherProfile.first_name, otherProfile.last_name].filter(Boolean).join(" ") || "Roomie"
      : "Roomie",
    avatar: otherProfile?.profile_images?.[0] || null,
  };

  const { data: messages } = await supabase
    .from("messages").select("id, sender_id, sender_type, content, created_at")
    .eq("conversation_id", conv.id).order("created_at", { ascending: true }).limit(100);

  return NextResponse.json({ conversation_id: conv.id, property: null, other_party: otherParty, other_user_id: otherStudentId, messages: messages || [] });
}
