import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { fetchNearbyPois, deriveSectorAmenities } from "../../../../src/utils/nearby";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// Computes surrounding POIs for a property and persists them. The derived
// sector tags overwrite amenities_sector so the match score reflects objective
// reality (and never goes stale) rather than the owner's manual text.
async function computeAndStorePois(propertyId: string, lat: number, lng: number) {
  const result = await fetchNearbyPois(lat, lng);
  await supabase
    .from("properties")
    .update({
      nearby_pois: result,
      nearby_computed_at: new Date().toISOString(),
      amenities_sector: deriveSectorAmenities(result.places),
    })
    .eq("property_id", propertyId);
}

// POST /api/owner/properties — crear nueva propiedad
export async function POST(request: Request) {
  const body = await request.json();
  const {
    owner_id, title, monthly_rent, city, neighborhood, bedrooms,
    description, image_url, images, allows_students, requires_co_debtor,
    tags, address, latitude, longitude,
    property_type, localidad, bathrooms, area_sqm, stratum, floor_number, building_floors,
    amenities_interior, amenities_exterior, amenities_sector, utilities_included
  } = body;

  if (!owner_id || !title || !monthly_rent || !city) {
    return NextResponse.json({ error: "owner_id, title, monthly_rent y city son requeridos" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("properties")
    .insert({
      owner_id,
      title,
      monthly_rent,
      city,
      neighborhood: neighborhood || null,
      bedrooms: bedrooms || 1,
      description: description || null,
      image_url: image_url || (images?.[0] ?? null),
      images: images || [],
      allows_students: allows_students ?? true,
      requires_co_debtor: requires_co_debtor ?? false,
      tags: tags || [],
      address: address || null,
      latitude: latitude || null,
      longitude: longitude || null,
      property_type: property_type || "Apartamento",
      localidad: localidad || null,
      bathrooms: bathrooms || 1,
      area_sqm: area_sqm || null,
      stratum: stratum || null,
      floor_number: floor_number || null,
      building_floors: building_floors || null,
      amenities_interior: amenities_interior || [],
      amenities_exterior: amenities_exterior || [],
      amenities_sector: amenities_sector || [],
      utilities_included: utilities_included || [],
    })
    .select("property_id, title")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (latitude && longitude) {
    await computeAndStorePois(data.property_id, Number(latitude), Number(longitude));
  }

  return NextResponse.json(data, { status: 201 });
}

// PATCH /api/owner/properties — actualizar propiedad existente
export async function PATCH(request: Request) {
  const body = await request.json();
  const { property_id, owner_id, ...fields } = body;

  if (!property_id || !owner_id) {
    return NextResponse.json({ error: "property_id y owner_id requeridos" }, { status: 400 });
  }

  const { data: existing } = await supabase
    .from("properties").select("owner_id").eq("property_id", property_id).single();

  if (existing?.owner_id !== owner_id) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  const ALLOWED = ["title","monthly_rent","city","neighborhood","bedrooms","description",
    "image_url","images","allows_students","requires_co_debtor","tags","address","latitude","longitude",
    "property_type","localidad","bathrooms","area_sqm","stratum","floor_number","building_floors",
    "amenities_interior","amenities_exterior","amenities_sector","utilities_included"];
  const update = Object.fromEntries(Object.entries(fields).filter(([k]) => ALLOWED.includes(k)));

  const { data, error } = await supabase
    .from("properties").update(update).eq("property_id", property_id)
    .select("property_id, title, latitude, longitude").single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Recompute POIs only when the location changed.
  const locationChanged = "latitude" in update || "longitude" in update;
  if (locationChanged && data.latitude && data.longitude) {
    await computeAndStorePois(data.property_id, Number(data.latitude), Number(data.longitude));
  }

  return NextResponse.json({ property_id: data.property_id, title: data.title });
}

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
      images,
      description,
      tags,
      allows_students,
      requires_co_debtor,
      address,
      latitude,
      longitude,
      property_type,
      localidad,
      bathrooms,
      area_sqm,
      stratum,
      floor_number,
      building_floors,
      amenities_interior,
      amenities_exterior,
      amenities_sector,
      utilities_included,
      nearby_pois,
      created_at
    `)
    .eq("owner_id", ownerId)
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}
