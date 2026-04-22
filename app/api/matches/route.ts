import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// GET /api/matches?user_id=xxx — matches bilaterales del arrendatario
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get("user_id");

  if (!userId) {
    return NextResponse.json({ error: "user_id requerido" }, { status: 400 });
  }

  // 1. Fetch Property Matches
  const { data: propertyMatches, error: propError } = await supabase
    .from("property_matches")
    .select(`
      id,
      created_at,
      match_score,
      property_id,
      owner_id,
      properties (
        property_id,
        title,
        monthly_rent,
        neighborhood,
        city,
        bedrooms,
        image_url,
        images,
        description,
        tags
      ),
      owners (
        owner_id,
        name,
        email,
        phone
      )
    `)
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (propError) {
    return NextResponse.json({ error: propError.message }, { status: 500 });
  }

  // 2. Fetch Roommate Matches — just the IDs, then fetch profiles separately
  const { data: roommateMatches } = await supabase
    .from("roommate_matches")
    .select("match_id, student_1_id, student_2_id, compatibility_score, created_at")
    .or(`student_1_id.eq.${userId},student_2_id.eq.${userId}`)
    .eq("status", "matched")
    .order("created_at", { ascending: false });

  const formattedRM: any[] = [];

  if (roommateMatches && roommateMatches.length > 0) {
    const uid = userId.toLowerCase();
    const otherIds = roommateMatches.map(m =>
      m.student_1_id.toLowerCase() === uid ? m.student_2_id : m.student_1_id
    );

    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, first_name, last_name, profile_images, job_title, university_name")
      .in("id", otherIds);

    const profileById: Record<string, any> = {};
    (profiles || []).forEach(p => { profileById[p.id] = p; });

    roommateMatches.forEach(m => {
      const otherId = m.student_1_id.toLowerCase() === uid ? m.student_2_id : m.student_1_id;
      const other   = profileById[otherId];
      if (!other) return;
      formattedRM.push({
        id:          m.match_id,
        created_at:  m.created_at,
        match_score: m.compatibility_score,
        type:        "roommate",
        other: {
          id:     other.id,
          name:   `${other.first_name || ""} ${other.last_name || ""}`.trim() || "Roomie",
          image:  other.profile_images?.[0] || "https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=640",
          detail: other.university_name || other.job_title || "Bogotá",
        },
      });
    });
  }

  const formattedProp = (propertyMatches || []).map(m => ({ ...m, type: "property" }));

  return NextResponse.json(
    [...formattedProp, ...formattedRM].sort((a, b) =>
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    )
  );
}
