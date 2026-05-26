import { NextResponse } from "next/server";
import { fetchNearbyPois } from "../../../../src/utils/nearby";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const lat = Number(searchParams.get("lat"));
  const lng = Number(searchParams.get("lng"));
  const radius = Math.min(Number(searchParams.get("radius") || 900), 1500);

  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    return NextResponse.json({ error: "lat y lng son requeridos" }, { status: 400 });
  }

  const result = await fetchNearbyPois(lat, lng, radius);
  return NextResponse.json({
    places: result.places,
    summary: result.summary,
    provider: "openstreetmap",
  });
}
