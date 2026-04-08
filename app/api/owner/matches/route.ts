import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// GET /api/owner/matches?owner_id=xxx — matches del propietario
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const ownerId = searchParams.get("owner_id");

  if (!ownerId) {
    return NextResponse.json({ error: "owner_id requerido" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("property_matches")
    .select(`
      id,
      user_id,
      created_at,
      match_score,
      properties (
        property_id,
        title,
        monthly_rent,
        neighborhood,
        city,
        image_url
      )
    `)
    .eq("owner_id", ownerId)
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}
