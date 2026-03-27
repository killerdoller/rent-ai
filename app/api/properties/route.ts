import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function GET() {
  try {
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
        created_at,
        owners (
          owner_id,
          name,
          email,
          phone
        )
      `)
      .eq("allows_students", true)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Supabase error:", error);
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    // Transform data to match the CardData format expected by the frontend
    const properties = (data || []).map((p: any) => ({
      id: p.property_id,
      type: "room" as const,
      image: p.image_url || "https://images.unsplash.com/photo-1611234688667-76b6d8fadd75?w=1080",
      title: p.title,
      location: `${p.neighborhood || ""}, ${p.city}`.replace(/^, /, ""),
      price: Number(p.monthly_rent),
      bedrooms: p.bedrooms || 1,
      description: p.description || "",
      tags: p.tags || [],
      matchScore: Math.floor(Math.random() * 20) + 75, // TODO: real match scoring
      owner: p.owners,
    }));

    return NextResponse.json(properties);
  } catch (err) {
    console.error("API error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
