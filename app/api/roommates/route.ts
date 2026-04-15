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
    let query = supabase
      .from("profiles")
      .select(`
        id,
        name,
        bio,
        job_title,
        interests,
        lifestyle_tags,
        cleanliness_level,
        social_level,
        profile_images,
        user_mode
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

    const roommates = (data || []).map((p: any) => ({
      id: p.id,
      type: "roommate" as const,
      image:
        p.profile_images?.[0] ||
        "https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=640",
      title: p.name || "Roomie",
      name: p.name || "Roomie",
      location: p.job_title || "",
      description: p.bio || "",
      tags: [
        ...(p.lifestyle_tags || []),
        ...(p.interests || []),
      ].slice(0, 8),
      matchScore: Math.floor(Math.random() * 20) + 75,
    }));

    return NextResponse.json(roommates);
  } catch (err) {
    console.error("API error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
