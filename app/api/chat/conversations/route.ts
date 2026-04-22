import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

async function lastMessages(convIds: string[]) {
  const map: Record<string, { content: string; created_at: string }> = {};
  if (!convIds.length) return map;
  await Promise.all(convIds.map(async cid => {
    const { data } = await supabase
      .from("messages").select("content, created_at")
      .eq("conversation_id", cid).order("created_at", { ascending: false }).limit(1);
    if (data?.[0]) map[cid] = data[0];
  }));
  return map;
}

// GET /api/chat/conversations?user_id=xxx  OR  ?owner_id=xxx
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const userId  = searchParams.get("user_id");
  const ownerId = searchParams.get("owner_id");

  if (!userId && !ownerId) {
    return NextResponse.json({ error: "user_id u owner_id requerido" }, { status: 400 });
  }

  const result: any[] = [];

  // ── Property matches (tenants & owners) ──
  let propMatchQ = supabase
    .from("property_matches")
    .select("id, user_id, property_id, owner_id, created_at")
    .order("created_at", { ascending: false });

  if (userId)  propMatchQ = propMatchQ.eq("user_id", userId);
  else         propMatchQ = propMatchQ.eq("owner_id", ownerId!);

  const { data: propMatches } = await propMatchQ;

  if (propMatches && propMatches.length > 0) {
    const matchIds = propMatches.map(m => m.id);
    const { data: propConvs } = await supabase
      .from("conversations").select("id, property_match_id, last_message_at")
      .in("property_match_id", matchIds);

    const convByMatch: Record<string, any> = {};
    (propConvs || []).forEach(c => { convByMatch[c.property_match_id] = c; });

    const lastMsg = await lastMessages((propConvs || []).map(c => c.id));

    const propertyIds = [...new Set(propMatches.map(m => m.property_id))];
    const { data: properties } = await supabase
      .from("properties").select("property_id, title, image_url, neighborhood")
      .in("property_id", propertyIds);
    const propById: Record<string, any> = {};
    (properties || []).forEach(p => { propById[p.property_id] = p; });

    const otherPartyById: Record<string, { name: string; avatar: string | null }> = {};
    if (userId) {
      const ownerIds = [...new Set(propMatches.map(m => m.owner_id))];
      const { data: owners } = await supabase
        .from("owners").select("owner_id, name").in("owner_id", ownerIds);
      (owners || []).forEach(o => { otherPartyById[o.owner_id] = { name: o.name, avatar: null }; });
    } else {
      const uids = [...new Set(propMatches.map(m => m.user_id))];
      const { data: profiles } = await supabase
        .from("profiles").select("id, first_name, last_name, avatar_url").in("id", uids);
      (profiles || []).forEach(p => {
        otherPartyById[p.id] = { name: [p.first_name, p.last_name].filter(Boolean).join(" ") || "Arrendatario", avatar: p.avatar_url };
      });
      const missing = uids.filter(id => !otherPartyById[id]);
      if (missing.length) {
        const { data: guests } = await supabase
          .from("guest_users").select("id, name").in("id", missing);
        (guests || []).forEach(g => { otherPartyById[g.id] = { name: g.name || "Arrendatario", avatar: null }; });
      }
    }

    propMatches.forEach(match => {
      const conv = convByMatch[match.id];
      const lm   = conv ? lastMsg[conv.id] : null;
      const otherParty = otherPartyById[userId ? match.owner_id : match.user_id] || { name: "Usuario", avatar: null };
      const prop = propById[match.property_id] || {};
      result.push({
        conversation_id:       conv?.id || null,
        match_id:              match.id,
        match_type:            "property",
        other_party_name:      otherParty.name,
        other_party_avatar:    otherParty.avatar,
        property_title:        prop.title || "Propiedad",
        property_image:        prop.image_url || null,
        property_neighborhood: prop.neighborhood || "",
        last_message:          lm?.content || null,
        last_message_at:       lm?.created_at || conv?.last_message_at || match.created_at,
        match_created_at:      match.created_at,
      });
    });
  }

  // ── Roommate matches (tenants only) ──
  if (userId) {
    const { data: rmMatches } = await supabase
      .from("roommate_matches")
      .select("match_id, student_1_id, student_2_id, created_at")
      .or(`student_1_id.eq.${userId},student_2_id.eq.${userId}`)
      .eq("status", "matched")
      .order("created_at", { ascending: false });

    if (rmMatches && rmMatches.length > 0) {
      const rmMatchIds = rmMatches.map(m => m.match_id);
      const { data: rmConvs } = await supabase
        .from("conversations").select("id, roommate_match_id, last_message_at")
        .in("roommate_match_id", rmMatchIds);

      const rmConvByMatch: Record<string, any> = {};
      (rmConvs || []).forEach(c => { rmConvByMatch[c.roommate_match_id] = c; });

      const rmLastMsg = await lastMessages((rmConvs || []).map(c => c.id));

      const uid = userId.toLowerCase();
      const otherIds = rmMatches.map(m => m.student_1_id.toLowerCase() === uid ? m.student_2_id : m.student_1_id);
      const { data: otherProfiles } = await supabase
        .from("profiles").select("id, first_name, last_name, profile_images, avatar_url")
        .in("id", otherIds);
      const profileById: Record<string, any> = {};
      (otherProfiles || []).forEach(p => { profileById[p.id] = p; });

      rmMatches.forEach(match => {
        const conv     = rmConvByMatch[match.match_id];
        const lm       = conv ? rmLastMsg[conv.id] : null;
        const otherId  = match.student_1_id.toLowerCase() === uid ? match.student_2_id : match.student_1_id;
        const other    = profileById[otherId];
        const name     = other ? [other.first_name, other.last_name].filter(Boolean).join(" ") || "Roomie" : "Roomie";
        const avatar   = other?.profile_images?.[0] || other?.avatar_url || null;
        result.push({
          conversation_id:       conv?.id || null,
          match_id:              match.match_id,
          match_type:            "roommate",
          other_party_name:      name,
          other_party_avatar:    avatar,
          property_title:        "Roomie",
          property_image:        avatar,
          property_neighborhood: "",
          last_message:          lm?.content || null,
          last_message_at:       lm?.created_at || conv?.last_message_at || match.created_at,
          match_created_at:      match.created_at,
        });
      });
    }
  }

  result.sort((a, b) => new Date(b.last_message_at).getTime() - new Date(a.last_message_at).getTime());
  return NextResponse.json(result);
}
