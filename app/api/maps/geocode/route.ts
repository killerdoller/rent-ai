import { NextResponse } from "next/server";

type GeoResult = {
  id: string;
  label: string;
  lat: number;
  lng: number;
  source: "google" | "nominatim" | "photon";
  precision?: string;
};

const BOGOTA_VIEWBOX = "-74.25,4.85,-73.99,4.46";
const BOGOTA_BOUNDS = "4.46,-74.25|4.85,-73.99";

function cleanAddress(input: string) {
  return input
    .replace(/\s+/g, " ")
    .replace(/\s*#\s*/g, " # ")
    .trim();
}

function withCity(query: string, city: string) {
  const cleaned = cleanAddress(query);
  const cityName = city.split(",")[0]?.trim().toLowerCase();
  if (cityName && cleaned.toLowerCase().includes(cityName)) return cleaned;
  return `${cleaned}, ${city}`;
}

function uniqueResults(results: GeoResult[]) {
  const seen = new Set<string>();
  return results.filter((result) => {
    const key = `${result.lat.toFixed(6)},${result.lng.toFixed(6)},${result.label.toLowerCase()}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function rankResults(results: GeoResult[], query: string) {
  const queryNumbers = query.match(/\d+/g) || [];
  const queryLower = query.toLowerCase();

  return [...results].sort((a, b) => scoreResult(b, queryNumbers, queryLower) - scoreResult(a, queryNumbers, queryLower));
}

function scoreResult(result: GeoResult, queryNumbers: string[], queryLower: string) {
  const label = result.label.toLowerCase();
  const labelNumbers: string[] = label.match(/\d+/g) ?? [];
  const hasHouseNumber = /#\s*\d+|\d+\s*-\s*\d+/.test(label);
  const matchingNumbers = queryNumbers.filter((number) => labelNumbers.includes(number)).length;

  let score = 0;
  if (result.source === "google") score += 100;
  if (hasHouseNumber) score += 45;
  score += matchingNumbers * 12;
  if (queryLower.includes("#") && label.includes("#")) score += 15;
  if (label.includes("upz") && !hasHouseNumber) score -= 18;
  if (label.includes("localidad") && !hasHouseNumber) score -= 8;
  return score;
}

async function googleGeocode(query: string, city: string): Promise<GeoResult[]> {
  const key = process.env.GOOGLE_MAPS_API_KEY;
  if (!key) return [];

  const url = new URL("https://maps.googleapis.com/maps/api/geocode/json");
  url.searchParams.set("address", withCity(query, city));
  url.searchParams.set("region", "co");
  url.searchParams.set("components", "country:CO");
  url.searchParams.set("bounds", BOGOTA_BOUNDS);
  url.searchParams.set("language", "es");
  url.searchParams.set("key", key);

  const response = await fetch(url);
  if (!response.ok) return [];

  const data = await response.json();
  return (data.results || []).slice(0, 5).map((item: any) => ({
    id: item.place_id,
    label: item.formatted_address,
    lat: item.geometry.location.lat,
    lng: item.geometry.location.lng,
    source: "google",
    precision: item.geometry.location_type,
  }));
}

async function googleGeocodePlace(placeId: string): Promise<GeoResult | null> {
  const key = process.env.GOOGLE_MAPS_API_KEY;
  if (!key) return null;

  const url = new URL("https://maps.googleapis.com/maps/api/geocode/json");
  url.searchParams.set("place_id", placeId);
  url.searchParams.set("region", "co");
  url.searchParams.set("language", "es");
  url.searchParams.set("key", key);

  const response = await fetch(url);
  if (!response.ok) return null;

  const data = await response.json();
  const item = data.results?.[0];
  if (!item) return null;

  return {
    id: item.place_id,
    label: item.formatted_address,
    lat: item.geometry.location.lat,
    lng: item.geometry.location.lng,
    source: "google",
    precision: item.geometry.location_type,
  };
}

async function nominatimGeocode(query: string, city: string): Promise<GeoResult[]> {
  const variants = [
    withCity(query, city),
    withCity(query.replace(/\s*#\s*/g, " "), city),
    withCity(query.replace(/\s*#\s*/g, " No. "), city),
  ];

  const all: GeoResult[] = [];

  for (const variant of variants) {
    const url = new URL("https://nominatim.openstreetmap.org/search");
    url.searchParams.set("format", "jsonv2");
    url.searchParams.set("addressdetails", "1");
    url.searchParams.set("limit", "5");
    url.searchParams.set("countrycodes", "co");
    url.searchParams.set("bounded", "1");
    url.searchParams.set("viewbox", BOGOTA_VIEWBOX);
    url.searchParams.set("accept-language", "es");
    url.searchParams.set("q", variant);

    const response = await fetch(url, {
      headers: { "User-Agent": "RentAI/1.0 geocoding contact: local-dev" },
    });
    if (!response.ok) continue;

    const data = await response.json();
    all.push(
      ...(data || []).map((item: any) => ({
        id: String(item.place_id),
        label: item.display_name,
        lat: Number(item.lat),
        lng: Number(item.lon),
        source: "nominatim" as const,
        precision: item.type || item.class,
      })),
    );
  }

  return uniqueResults(all).slice(0, 5);
}

async function photonGeocode(query: string, city: string): Promise<GeoResult[]> {
  const url = new URL("https://photon.komoot.io/api/");
  url.searchParams.set("q", withCity(query.replace(/#/g, " "), city));
  url.searchParams.set("limit", "5");
  url.searchParams.set("lat", "4.711");
  url.searchParams.set("lon", "-74.0721");

  const response = await fetch(url);
  if (!response.ok) return [];

  const data = await response.json();
  return (data.features || []).map((item: any, index: number) => {
    const props = item.properties || {};
    const parts = [
      props.name,
      props.street && props.housenumber ? `${props.street} # ${props.housenumber}` : props.street,
      props.locality || props.district,
      props.city,
    ].filter(Boolean);

    return {
      id: `${props.osm_id || "photon"}-${index}`,
      label: parts.join(", ") || "Direccion encontrada",
      lat: Number(item.geometry.coordinates[1]),
      lng: Number(item.geometry.coordinates[0]),
      source: "photon" as const,
      precision: props.osm_value || props.type,
    };
  });
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = cleanAddress(searchParams.get("q") || "");
  const city = cleanAddress(searchParams.get("city") || "Bogota, Colombia");
  const placeId = cleanAddress(searchParams.get("place_id") || "");
  const googleOnly = searchParams.get("google_only") === "1";

  if (placeId) {
    const result = await googleGeocodePlace(placeId);
    return NextResponse.json({
      result,
      results: result ? [result] : [],
      provider: "google",
    });
  }

  if (query.length < 3) {
    return NextResponse.json({ results: [] });
  }

  try {
    const google = await googleGeocode(query, city);
    if (google.length > 0) {
      return NextResponse.json({ results: rankResults(google, query), provider: "google" });
    }

    if (googleOnly) {
      return NextResponse.json({ results: [], provider: "google" });
    }

    const [nominatim, photon] = await Promise.all([
      nominatimGeocode(query, city),
      photonGeocode(query, city),
    ]);

    return NextResponse.json({
      results: rankResults(uniqueResults([...nominatim, ...photon]), query).slice(0, 6),
      provider: "openstreetmap",
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "No se pudo buscar la direccion" },
      { status: 500 },
    );
  }
}
