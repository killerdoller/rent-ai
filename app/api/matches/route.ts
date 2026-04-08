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

  const { data, error } = await supabase
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

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}
