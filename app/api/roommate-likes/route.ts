import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY! // Use service role to bypass RLS for guest users
);

export async function POST(request: Request) {
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

    // Check if it created a match (via trigger)
    const { data: match } = await supabase
      .from("roommate_matches")
      .select("*")
      .or(`and(student_1_id.eq.${user_id},student_2_id.eq.${liked_user_id}),and(student_1_id.eq.${liked_user_id},student_2_id.eq.${user_id})`)
      .eq("status", "matched")
      .maybeSingle();

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
