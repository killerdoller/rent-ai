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
  const callerType = searchParams.get("caller_type") as "user" | "owner" | null;

  if (!matchId) {
    return NextResponse.json({ error: "match_id requerido" }, { status: 400 });
  }

  // Get property match
  const { data: match, error: matchErr } = await supabase
    .from("property_matches")
    .select("id, user_id, property_id, owner_id, created_at")
    .eq("id", matchId)
    .single();

  if (matchErr || !match) {
    return NextResponse.json({ error: "Match no encontrado" }, { status: 404 });
  }

  // Find or create conversation
  let { data: conv } = await supabase
    .from("conversations")
    .select("id, created_at, last_message_at")
    .eq("property_match_id", matchId)
    .maybeSingle();

  if (!conv) {
    const { data: newConv, error: convErr } = await supabase
      .from("conversations")
      .insert({ property_match_id: matchId })
      .select("id, created_at, last_message_at")
      .single();
    if (convErr || !newConv) {
      return NextResponse.json({ error: "Error creando conversación" }, { status: 500 });
    }
    conv = newConv;
  }

  // Property info
  const { data: property } = await supabase
    .from("properties")
    .select("property_id, title, image_url, neighborhood, city, monthly_rent")
    .eq("property_id", match.property_id)
    .maybeSingle();

  // Other party info
  let otherParty = { name: "Usuario", avatar: null as string | null };
  if (callerType === "user") {
    const { data: owner } = await supabase
      .from("owners")
      .select("owner_id, name")
      .eq("owner_id", match.owner_id)
      .maybeSingle();
    if (owner) otherParty = { name: owner.name, avatar: null };
  } else {
    const { data: profile } = await supabase
      .from("profiles")
      .select("id, first_name, last_name, avatar_url")
      .eq("id", match.user_id)
      .maybeSingle();
    if (profile) {
      otherParty = {
        name: [profile.first_name, profile.last_name].filter(Boolean).join(" ") || "Arrendatario",
        avatar: profile.avatar_url,
      };
    } else {
      const { data: guest } = await supabase
        .from("guest_users")
        .select("id, name")
        .eq("id", match.user_id)
        .maybeSingle();
      if (guest) otherParty = { name: guest.name || "Arrendatario", avatar: null };
    }
  }

  // Messages
  const { data: messages } = await supabase
    .from("messages")
    .select("id, sender_id, sender_type, content, created_at")
    .eq("conversation_id", conv.id)
    .order("created_at", { ascending: true })
    .limit(100);

  return NextResponse.json({
    conversation_id: conv.id,
    property:        property || null,
    other_party:     otherParty,
    messages:        messages || [],
  });
}
