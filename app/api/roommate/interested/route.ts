import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get("user_id");

  if (!userId) {
    return NextResponse.json({ error: "Missing user_id" }, { status: 400 });
  }

  try {
    // 1. Fetch people who liked the current user
    // but the current user hasn't liked back yet (no match)
    // and hasn't rejected them
    const { data: likes, error: likesError } = await supabase
      .from("roommate_likes")
      .select(`
        id,
        user_id,
        created_at,
        profiles!roommate_likes_user_id_fkey (
          id,
          first_name,
          last_name,
          bio,
          job_title,
          university_name,
          profile_images,
          monthly_budget,
          lifestyle_tags,
          interests
        )
      `)
      .eq("liked_user_id", userId)
      .order("created_at", { ascending: false });

    if (likesError) throw likesError;

    // 2. Filter out those who already matched or were rejected
    const { data: matches } = await supabase
      .from("roommate_matches")
      .select("student_1_id, student_2_id")
      .or(`student_1_id.eq.${userId},student_2_id.eq.${userId}`);

    const { data: rejections } = await supabase
      .from("roommate_rejections")
      .select("rejected_user_id")
      .eq("user_id", userId);

    const matchedIds = new Set((matches || []).flatMap(m => [m.student_1_id, m.student_2_id]));
    const rejectedIds = new Set((rejections || []).map(r => r.rejected_user_id));

    const interested = (likes || [])
      .filter((l: any) => !matchedIds.has(l.user_id) && !rejectedIds.has(l.user_id))
      .map((l: any) => ({
        like_id: l.id,
        user_id: l.user_id,
        liked_at: l.created_at,
        profile: l.profiles
      }));

    return NextResponse.json(interested);
  } catch (err: any) {
    console.error("Roommate interested error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
