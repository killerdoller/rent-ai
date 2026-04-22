import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) throw new Error("Supabase env vars not configured");
  return createClient(url, key);
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get("exclude_user_id");

  try {
    const supabase = getSupabase();

    // 1. IDs que el usuario ya vio (likes + rechazos) para excluirlos del deck
    const seenIds = new Set<string>();
    if (userId) {
      const [{ data: liked }, { data: rejected }] = await Promise.all([
        supabase.from("roommate_likes").select("liked_user_id").eq("user_id", userId),
        supabase.from("roommate_rejections").select("rejected_user_id").eq("user_id", userId),
      ]);
      (liked || []).forEach((r: any) => seenIds.add(r.liked_user_id));
      (rejected || []).forEach((r: any) => seenIds.add(r.rejected_user_id));
    }

    // 2. Fetch perfiles en modo find-roommate
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
      .limit(100);

    if (userId) query = query.neq("id", userId);

    const { data, error } = await query;

    if (error) {
      console.error("Supabase error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // 3. Quiénes me dieron like (para mostrar badge "Te dio like")
    const likedMeIds = new Set<string>();
    if (userId) {
      const { data: likes } = await supabase
        .from("roommate_likes")
        .select("user_id")
        .eq("liked_user_id", userId);
      (likes || []).forEach((l: any) => likedMeIds.add(l.user_id));
    }

    // 4. Filtrar ya vistos y mapear
    const roommates = (data || [])
      .filter((p: any) => !seenIds.has(p.id))
      .map((p: any) => {
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
