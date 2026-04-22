import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const excludeUserId = searchParams.get("exclude_user_id");

  try {
    // 1. Fetch profiles
    let query = supabase
      .from("profiles")
      .select(`
        id,
        first_name,
        last_name,
        bio,
        job_title,
        university_name,
        interests,
        lifestyle_tags,
        cleanliness_level,
        social_level,
        profile_images,
        user_mode,
        monthly_budget
      `)
      .eq("user_mode", "find-roommate")
      .limit(50);

    if (excludeUserId) {
      query = query.neq("id", excludeUserId);
    }

    const { data, error } = await query;

    if (error) {
      console.error("Supabase error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // 2. Fetch people who liked the current user (if any)
    const likedMeIds = new Set<string>();
    if (excludeUserId) {
      try {
        const { data: likes } = await supabase
          .from("roommate_likes")
          .select("user_id")
          .eq("liked_user_id", excludeUserId);
        
        if (likes) {
          likes.forEach((l: any) => likedMeIds.add(l.user_id));
        }
      } catch (err) {
        console.warn("Could not fetch roommate_likes (table might not exist yet)");
      }
    }

    const roommates = (data || []).map((p: any) => {
      const fullName = `${p.first_name || ""} ${p.last_name || ""}`.trim() || "Roomie";
      return {
        id: p.id,
        type: "roommate" as const,
        image:
          p.profile_images?.[0] ||
          "https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=640",
        title: fullName,
        name: fullName,
        location: p.university_name || p.job_title || "Bogotá",
        occupation: p.job_title || p.university_name || "",
        price: p.monthly_budget ? Number(p.monthly_budget) : undefined,
        description: p.bio || "",
        likedYou: likedMeIds.has(p.id),
        tags: [
          ...(p.lifestyle_tags || []),
          ...(p.interests || []),
        ].slice(0, 8),
        matchScore: Math.floor(Math.random() * 20) + 75,
      };
    });

    return NextResponse.json(roommates);
  } catch (err: any) {
    console.error("API error:", err);
    return NextResponse.json({ error: err.message || "Internal server error" }, { status: 500 });
  }
}
