import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// GET /api/chat/conversations?user_id=xxx  OR  ?owner_id=xxx
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const userId  = searchParams.get("user_id");
  const ownerId = searchParams.get("owner_id");

  if (!userId && !ownerId) {
    return NextResponse.json({ error: "user_id u owner_id requerido" }, { status: 400 });
  }

  // Get all property matches for this caller
  let matchQ = supabase
    .from("property_matches")
    .select("id, user_id, property_id, owner_id, created_at")
    .order("created_at", { ascending: false });

  if (userId)  matchQ = matchQ.eq("user_id", userId);
  else         matchQ = matchQ.eq("owner_id", ownerId!);

  const { data: matches } = await matchQ;
  if (!matches || matches.length === 0) return NextResponse.json([]);

  // Conversations (may not exist for every match)
  const matchIds = matches.map(m => m.id);
  const { data: conversations } = await supabase
    .from("conversations")
    .select("id, property_match_id, last_message_at")
    .in("property_match_id", matchIds);

  const convByMatch: Record<string, { id: string; last_message_at: string }> = {};
  (conversations || []).forEach(c => { convByMatch[c.property_match_id] = c; });

  // Last message for each conversation
  const lastMsgByConv: Record<string, { content: string; created_at: string }> = {};
  const convIds = (conversations || []).map(c => c.id);
  if (convIds.length > 0) {
    // Fetch last message per conversation (one query per conv — acceptable for small N)
    await Promise.all(convIds.map(async cid => {
      const { data } = await supabase
        .from("messages")
        .select("content, created_at")
        .eq("conversation_id", cid)
        .order("created_at", { ascending: false })
        .limit(1);
      if (data?.[0]) lastMsgByConv[cid] = data[0];
    }));
  }

  // Property info
  const propertyIds = [...new Set(matches.map(m => m.property_id))];
  const { data: properties } = await supabase
    .from("properties")
    .select("property_id, title, image_url, neighborhood")
    .in("property_id", propertyIds);
  const propById: Record<string, any> = {};
  (properties || []).forEach(p => { propById[p.property_id] = p; });

  // Other party info
  const otherPartyById: Record<string, { name: string; avatar: string | null }> = {};
  if (userId) {
    const ownerIds = [...new Set(matches.map(m => m.owner_id))];
    const { data: owners } = await supabase
      .from("owners")
      .select("owner_id, name")
      .in("owner_id", ownerIds);
    (owners || []).forEach(o => { otherPartyById[o.owner_id] = { name: o.name, avatar: null }; });
  } else {
    const userIds = [...new Set(matches.map(m => m.user_id))];
    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, first_name, last_name, avatar_url")
      .in("id", userIds);
    (profiles || []).forEach(p => {
      otherPartyById[p.id] = {
        name: [p.first_name, p.last_name].filter(Boolean).join(" ") || "Arrendatario",
        avatar: p.avatar_url,
      };
    });
    const missingIds = userIds.filter(id => !otherPartyById[id]);
    if (missingIds.length > 0) {
      const { data: guests } = await supabase
        .from("guest_users")
        .select("id, name")
        .in("id", missingIds);
      (guests || []).forEach(g => {
        otherPartyById[g.id] = { name: g.name || "Arrendatario", avatar: null };
      });
    }
  }

  const result = matches.map(match => {
    const conv       = convByMatch[match.id];
    const lastMsg    = conv ? lastMsgByConv[conv.id] : null;
    const otherId    = userId ? match.owner_id : match.user_id;
    const otherParty = otherPartyById[otherId] || { name: "Usuario", avatar: null };
    const prop       = propById[match.property_id] || {};

    return {
      conversation_id:       conv?.id || null,
      match_id:              match.id,
      other_party_name:      otherParty.name,
      other_party_avatar:    otherParty.avatar,
      property_title:        prop.title || "Propiedad",
      property_image:        prop.image_url || null,
      property_neighborhood: prop.neighborhood || "",
      last_message:          lastMsg?.content || null,
      last_message_at:       lastMsg?.created_at || conv?.last_message_at || match.created_at,
      match_created_at:      match.created_at,
    };
  });

  return NextResponse.json(result);
}
