import { NextResponse } from "next/server";

type AmenityCategory = "gym" | "education" | "market" | "transport" | "park" | "health";

const CATEGORY_LABELS: Record<AmenityCategory, string> = {
  gym: "Gimnasios",
  education: "Educacion",
  market: "Mercados",
  transport: "Transporte",
  park: "Parques",
  health: "Salud",
};

function buildOverpassQuery(lat: number, lng: number, radius: number) {
  return `
    [out:json][timeout:12];
    (
      node(around:${radius},${lat},${lng})["leisure"="fitness_centre"];
      way(around:${radius},${lat},${lng})["leisure"="fitness_centre"];
      node(around:${radius},${lat},${lng})["amenity"~"school|university|college|kindergarten|library"];
      way(around:${radius},${lat},${lng})["amenity"~"school|university|college|kindergarten|library"];
      node(around:${radius},${lat},${lng})["shop"~"supermarket|convenience"];
      way(around:${radius},${lat},${lng})["shop"~"supermarket|convenience"];
      node(around:${radius},${lat},${lng})["public_transport"];
      node(around:${radius},${lat},${lng})["highway"="bus_stop"];
      node(around:${radius},${lat},${lng})["leisure"="park"];
      way(around:${radius},${lat},${lng})["leisure"="park"];
      node(around:${radius},${lat},${lng})["amenity"~"clinic|hospital|doctors|dentist|pharmacy"];
      way(around:${radius},${lat},${lng})["amenity"~"clinic|hospital|doctors|dentist|pharmacy"];
    );
    out center tags 45;
  `;
}

function getCategory(tags: Record<string, string>): AmenityCategory | null {
  if (tags.leisure === "fitness_centre") return "gym";
  if (["school", "university", "college", "kindergarten", "library"].includes(tags.amenity)) return "education";
  if (["supermarket", "convenience"].includes(tags.shop)) return "market";
  if (tags.public_transport || tags.highway === "bus_stop") return "transport";
  if (tags.leisure === "park") return "park";
  if (["clinic", "hospital", "doctors", "dentist", "pharmacy"].includes(tags.amenity)) return "health";
  return null;
}

function distanceMeters(fromLat: number, fromLng: number, toLat: number, toLng: number) {
  const earthRadius = 6371000;
  const dLat = ((toLat - fromLat) * Math.PI) / 180;
  const dLng = ((toLng - fromLng) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((fromLat * Math.PI) / 180) *
      Math.cos((toLat * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return Math.round(earthRadius * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const lat = Number(searchParams.get("lat"));
  const lng = Number(searchParams.get("lng"));
  const radius = Math.min(Number(searchParams.get("radius") || 900), 1500);

  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    return NextResponse.json({ error: "lat y lng son requeridos" }, { status: 400 });
  }

  try {
    const response = await fetch("https://overpass-api.de/api/interpreter", {
      method: "POST",
      headers: { "Content-Type": "text/plain;charset=UTF-8" },
      body: buildOverpassQuery(lat, lng, radius),
    });

    if (!response.ok) {
      return NextResponse.json({ places: [], provider: "openstreetmap" });
    }

    const data = await response.json();
    const places = (data.elements || [])
      .map((item: any) => {
        const tags = item.tags || {};
        const category = getCategory(tags);
        const placeLat = Number(item.lat ?? item.center?.lat);
        const placeLng = Number(item.lon ?? item.center?.lon);

        if (!category || !Number.isFinite(placeLat) || !Number.isFinite(placeLng)) return null;

        return {
          id: `${item.type}-${item.id}`,
          name: tags.name || CATEGORY_LABELS[category],
          category,
          categoryLabel: CATEGORY_LABELS[category],
          lat: placeLat,
          lng: placeLng,
          distanceMeters: distanceMeters(lat, lng, placeLat, placeLng),
        };
      })
      .filter(Boolean)
      .sort((a: any, b: any) => a.distanceMeters - b.distanceMeters)
      .slice(0, 35);

    return NextResponse.json({ places, provider: "openstreetmap" });
  } catch {
    return NextResponse.json({ places: [], provider: "openstreetmap" });
  }
}
