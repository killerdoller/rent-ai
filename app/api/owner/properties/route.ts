import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// GET /api/owner/properties?owner_id=xxx
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const ownerId = searchParams.get("owner_id");

  if (!ownerId) {
    return NextResponse.json({ error: "owner_id requerido" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("properties")
    .select(`
      property_id,
      title,
      monthly_rent,
      neighborhood,
      city,
      bedrooms,
      image_url,
      description,
      tags,
      allows_students,
      requires_co_debtor,
      created_at
    `)
    .eq("owner_id", ownerId)
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}
