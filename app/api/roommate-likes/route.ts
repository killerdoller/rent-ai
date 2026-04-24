import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("Supabase env vars not configured");
  return createClient(url, key);
}

export async function POST(request: Request) {
  const supabase = getSupabase();
  try {
    const { user_id, liked_user_id } = await request.json();

    if (!user_id || !liked_user_id) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const { data, error } = await supabase
      .from("roommate_likes")
      .insert({ user_id, liked_user_id })
      .select()
      .single();

    if (error) {
      // Handle unique constraint (already liked)
      if (error.code === "23505") {
        return NextResponse.json({ message: "Already liked" });
      }
      throw error;
    }

    // Check if it created a match (via trigger) — only count matches from the last 5s to avoid
    // returning pre-existing rows when swipe history is cleared and user re-swipes
    const recentCutoff = new Date(Date.now() - 5000).toISOString();
    let { data: match } = await supabase
      .from("roommate_matches")
      .select("*")
      .or(`and(student_1_id.eq.${user_id},student_2_id.eq.${liked_user_id}),and(student_1_id.eq.${liked_user_id},student_2_id.eq.${user_id})`)
      .eq("status", "matched")
      .gt("created_at", recentCutoff)
      .maybeSingle();

    // --- HACK PARA LOCAL DEV: Forzamos el match de roomies ---
    if (!match && user_id === "guest_local_dev") {
      const { data: forcedMatch } = await supabase
        .from("roommate_matches")
        .insert({ student_1_id: user_id, student_2_id: liked_user_id, status: "matched", compatibility_score: 98 })
        .select("*")
        .single();
      match = forcedMatch;
    }

    return NextResponse.json({ 
      success: true, 
      isMatch: !!match,
      match_id: match?.match_id 
    });
  } catch (err: any) {
    console.error("Roommate like error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
