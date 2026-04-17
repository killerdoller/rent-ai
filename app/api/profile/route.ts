import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// Service role client — bypasses RLS, used when user_id is passed from client
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const PROFILE_FIELDS = `
  id, first_name, last_name, age, job_title, university_name,
  city, monthly_budget, user_mode, avatar_url, bio,
  interests, lifestyle_tags, cleanliness_level, social_level, profile_images
`;

const PATCH_ALLOWED = [
  "first_name", "last_name", "age", "university_name", "city",
  "monthly_budget", "user_mode", "bio", "job_title",
  "interests", "lifestyle_tags", "cleanliness_level",
  "social_level", "avatar_url", "profile_images",
];

// GET /api/profile?user_id=xxx
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get("user_id");

  if (!userId) {
    return NextResponse.json({ error: "user_id requerido" }, { status: 400 });
  }

  const { data, error } = await supabaseAdmin
    .from("profiles")
    .select(PROFILE_FIELDS)
    .eq("id", userId)
    .single();

  if (error || !data) {
    return NextResponse.json({ error: error?.message || "Perfil no encontrado" }, { status: 404 });
  }

  return NextResponse.json(data);
}

// PATCH /api/profile — body: { user_id, ...fields }
export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const { user_id, ...rest } = body;

    if (!user_id) {
      return NextResponse.json({ error: "user_id requerido" }, { status: 400 });
    }

    const updateData = Object.keys(rest)
      .filter(key => PATCH_ALLOWED.includes(key))
      .reduce((obj, key) => { obj[key] = rest[key]; return obj; }, {} as any);

    const { data, error } = await supabaseAdmin
      .from("profiles")
      .update(updateData)
      .eq("id", user_id)
      .select(PROFILE_FIELDS)
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json(data);
  } catch (err) {
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
