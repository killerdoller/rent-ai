import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// GET /api/profile
// Fetches the profile of the current user.
// For now, we'll try to get it from the session, or a mock user if none exists.
export async function GET() {
  try {
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      // For development/demonstration, if no user is logged in, 
      // we could return a 401 or a default public profile.
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data, error } = await supabase
      .from("profiles")
      .select("*, bio, job_title, interests, lifestyle_tags, cleanliness_level, social_level, profile_images")
      .eq("id", user.id)
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }

    return NextResponse.json(data);
  } catch (err) {
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

// PATCH /api/profile
// Updates the current user's profile
export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // List of allowed fields to update
    const allowedFields = [
      'first_name', 'last_name', 'university_name', 'city', 
      'monthly_budget', 'user_mode', 'bio', 'job_title', 
      'interests', 'lifestyle_tags', 'cleanliness_level', 
      'social_level', 'avatar_url', 'profile_images'
    ];
    
    const updateData = Object.keys(body)
      .filter(key => allowedFields.includes(key))
      .reduce((obj, key) => {
        obj[key] = body[key];
        return obj;
      }, {} as any);

    const { data, error } = await supabase
      .from("profiles")
      .update(updateData)
      .eq("id", user.id)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json(data);
  } catch (err) {
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

