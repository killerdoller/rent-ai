import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("Supabase env vars not configured");
  return createClient(url, key);
}

// GET /api/roommate/interested?user_id=xxx
// Retorna perfiles de personas que dieron like al usuario actual
// pero con quienes todavía no hay match ni rechazo (pendiente de respuesta)
export async function GET(request: Request) {
  const supabase = getSupabase();
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get("user_id");

  if (!userId) {
    return NextResponse.json({ error: "Missing user_id" }, { status: 400 });
  }

  try {
    // 1. Quiénes me dieron like
    const { data: likes, error: likesError } = await supabase
      .from("roommate_likes")
      .select("id, user_id, created_at")
      .eq("liked_user_id", userId)
      .order("created_at", { ascending: false });

    if (likesError) throw likesError;
    if (!likes || likes.length === 0) return NextResponse.json([]);

    // 2. Filtrar ya matcheados o rechazados
    const [{ data: matches }, { data: rejections }] = await Promise.all([
      supabase
        .from("roommate_matches")
        .select("student_1_id, student_2_id")
        .or(`student_1_id.eq.${userId},student_2_id.eq.${userId}`),
      supabase
        .from("roommate_rejections")
        .select("rejected_user_id")
        .eq("user_id", userId),
    ]);

    const matchedIds = new Set((matches || []).flatMap(m => [m.student_1_id, m.student_2_id]));
    const rejectedIds = new Set((rejections || []).map(r => r.rejected_user_id));

    const pendingLikes = likes.filter(
      (l: any) => !matchedIds.has(l.user_id) && !rejectedIds.has(l.user_id)
    );

    if (pendingLikes.length === 0) return NextResponse.json([]);

    // 3. Fetch perfiles de quienes me dieron like (query separada, sin FK join)
    const likerIds = pendingLikes.map((l: any) => l.user_id);
    const { data: profiles, error: profilesError } = await supabase
      .from("profiles")
      .select("id, first_name, last_name, bio, job_title, university_name, profile_images, monthly_budget, lifestyle_tags, interests, avatar_url")
      .in("id", likerIds);

    if (profilesError) throw profilesError;

    const profileById: Record<string, any> = {};
    (profiles || []).forEach(p => { profileById[p.id] = p; });

    const interested = pendingLikes.map((l: any) => ({
      like_id: l.id,
      user_id: l.user_id,
      liked_at: l.created_at,
      profile: profileById[l.user_id] || null,
    })).filter(item => item.profile !== null);

    return NextResponse.json(interested);
  } catch (err: any) {
    console.error("Roommate interested error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
