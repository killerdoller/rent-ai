import { NextResponse } from "next/server";

async function googleReverse(lat: number, lng: number) {
  const key = process.env.GOOGLE_MAPS_API_KEY;
  if (!key) return null;

  const url = new URL("https://maps.googleapis.com/maps/api/geocode/json");
  url.searchParams.set("latlng", `${lat},${lng}`);
  url.searchParams.set("region", "co");
  url.searchParams.set("language", "es");
  url.searchParams.set("key", key);

  const response = await fetch(url);
  if (!response.ok) return null;

  const data = await response.json();
  const first = data.results?.[0];
  if (!first) return null;

  return {
    address: first.formatted_address,
    provider: "google",
  };
}

async function nominatimReverse(lat: number, lng: number) {
  const url = new URL("https://nominatim.openstreetmap.org/reverse");
  url.searchParams.set("lat", String(lat));
  url.searchParams.set("lon", String(lng));
  url.searchParams.set("format", "jsonv2");
  url.searchParams.set("addressdetails", "1");
  url.searchParams.set("accept-language", "es");

  const response = await fetch(url, {
    headers: { "User-Agent": "RentAI/1.0 reverse-geocoding contact: local-dev" },
  });
  if (!response.ok) return null;

  const data = await response.json();
  const address = data.address || {};
  const street = [address.road, address.house_number].filter(Boolean).join(" # ");
  const zone = address.neighbourhood || address.suburb || address.city_district;

  return {
    address: street
      ? [street, zone].filter(Boolean).join(", ")
      : data.display_name?.split(",").slice(0, 3).join(",").trim(),
    provider: "openstreetmap",
  };
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const lat = Number(searchParams.get("lat"));
  const lng = Number(searchParams.get("lng"));

  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    return NextResponse.json({ error: "lat y lng son requeridos" }, { status: 400 });
  }

  try {
    const google = await googleReverse(lat, lng);
    if (google?.address) return NextResponse.json(google);

    const openStreetMap = await nominatimReverse(lat, lng);
    return NextResponse.json({
      address: openStreetMap?.address || `${lat.toFixed(5)}, ${lng.toFixed(5)}`,
      provider: openStreetMap?.provider || "coordinates",
    });
  } catch {
    return NextResponse.json({
      address: `${lat.toFixed(5)}, ${lng.toFixed(5)}`,
      provider: "coordinates",
    });
  }
}
