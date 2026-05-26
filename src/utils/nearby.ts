// Shared engine for fetching surrounding POIs from OpenStreetMap (Overpass API).
// Used by the live /api/maps/nearby route, the property-create precompute hook,
// and the backfill script. No API key required.
//
// Augmenta los resultados de Overpass con un catálogo curado de instituciones
// importantes de Bogotá (CURATED_POIS) — necesario porque OSM tiene gaps en
// universidades grandes como la Pedagógica Nacional.

import { CURATED_POIS } from "./bogotaInstitutions";

export type AmenityCategory =
  | "transmilenio"
  | "transport"
  | "university"
  | "school"
  | "market"
  | "mall"
  | "park"
  | "pharmacy"
  | "gym"
  | "food"
  | "nightlife";

export const CATEGORY_LABELS: Record<AmenityCategory, string> = {
  transmilenio: "TransMilenio",
  transport: "Transporte",
  university: "Universidades",
  school: "Colegios",
  market: "Supermercados",
  mall: "Centros Comerciales",
  park: "Parques",
  pharmacy: "Farmacias",
  gym: "Gimnasios",
  food: "Restaurantes",
  nightlife: "Vida nocturna",
};

// Sector-amenity tags that feed the match score. The strings MUST match the
// options the tenant can pick in CompleteProfile (desired_amenities_sector).
const SECTOR_TAG = {
  transport: "Transporte público",
  university: "Universidades",
  market: "Comercio",
  park: "Parques",
  pharmacy: "Farmacias",
  gym: "Gimnasio cerca",
  nightlife: "Vida nocturna",
  quiet: "Zona tranquila",
} as const;

// "Counts as nearby" walking thresholds (meters). People walk further for the BRT.
const THRESHOLD_M: Partial<Record<AmenityCategory, number>> = {
  transmilenio: 800,
  transport: 600,
  university: 600,
  school: 600,
  market: 600,
  mall: 800,
  park: 600,
  pharmacy: 600,
  gym: 600,
  nightlife: 600,
};

export interface NearbyPlace {
  id: string;
  name: string;
  category: AmenityCategory;
  categoryLabel: string;
  lat: number;
  lng: number;
  distanceMeters: number;
}

export interface CategorySummary {
  count: number;
  nearest: { name: string; distanceMeters: number };
}

export interface NearbyResult {
  radius: number;
  places: NearbyPlace[];
  summary: Partial<Record<AmenityCategory, CategorySummary>>;
}

const OVERPASS_ENDPOINT = "https://overpass-api.de/api/interpreter";

function buildOverpassQuery(lat: number, lng: number, radius: number) {
  const a = `around:${radius},${lat},${lng}`;
  // Notas sobre la query:
  //   - Universidades y colegios grandes: muchos campus en Bogotá (Pedagógica,
  //     Gimnasio Moderno, Femenino, Campestre, etc.) están mapeados como
  //     polígonos `landuse=*` en vez de `amenity=university|school`. Por eso
  //     hay queries por `landuse` Y por nombre con building o landuse.
  //   - NO incluimos `office=educational_institution` — es demasiado amplio
  //     (oficinas admin, tutorías, NGOs) y generaba falsos positivos.
  //   - Parques y zonas verdes: SOLO los que tienen tag `name`. Polígonos
  //     anónimos de `landuse=recreation_ground` o jardines de edificio no
  //     aportan información útil al inquilino.
  //   - TransMiCable: `aerialway=station`.
  return `
    [out:json][timeout:25];
    (
      nwr(${a})["public_transport"];
      nwr(${a})["highway"="bus_stop"];
      nwr(${a})["amenity"="bus_station"];
      nwr(${a})["aerialway"="station"];
      nwr(${a})["amenity"~"^(university|college)$"];
      nwr(${a})["building"~"^(university|college)$"];
      nwr(${a})["landuse"~"^(university|college|education)$"];
      nwr(${a})["name"~"^(Universidad|Pontificia|Politécnico|Colegio Mayor)",i]["building"];
      nwr(${a})["name"~"^(Universidad|Pontificia|Politécnico|Colegio Mayor)",i]["landuse"];
      nwr(${a})["amenity"="school"];
      nwr(${a})["building"="school"];
      nwr(${a})["landuse"="school"];
      nwr(${a})["name"~"^(Colegio|Gimnasio|Liceo|Instituto)",i]["building"];
      nwr(${a})["name"~"^(Colegio|Gimnasio|Liceo|Instituto)",i]["landuse"];
      nwr(${a})["shop"~"^(supermarket|convenience|discount)$"];
      nwr(${a})["shop"~"^(mall|shopping_centre)$"];
      nwr(${a})["leisure"~"^(park|garden|nature_reserve)$"]["name"];
      nwr(${a})["landuse"="recreation_ground"]["name"];
      nwr(${a})["amenity"="pharmacy"];
      nwr(${a})["leisure"="fitness_centre"];
      nwr(${a})["amenity"~"^(restaurant|cafe|fast_food)$"];
      nwr(${a})["amenity"~"^(bar|pub|nightclub)$"];
    );
    out center tags 250;
  `;
}

function isTransmilenio(tags: Record<string, string>) {
  // Señal fuerte: network/operator/brand explícito.
  const net = `${tags.network || ""} ${tags.operator || ""} ${tags.brand || ""}`.toLowerCase();
  if (net.includes("transmilenio")) return true;
  // Heurística: en Bogotá, `public_transport=station` con "Estación" en el
  // nombre es casi siempre TransMilenio (SITP y buses comunes usan
  // `highway=bus_stop`, no `=station`). Esto recupera las paradas que en OSM
  // no tienen network tag pero claramente son del sistema.
  if (tags.public_transport === "station") {
    const name = (tags.name || "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
    if (/\bestacion\b/.test(name)) return true;
  }
  return false;
}

// Patrones de nombre para capturar campus tagueados como polígonos
// (landuse) o edificios genéricos (building=yes) sin amenity formal.
const UNIVERSITY_NAME_RE = /^(Universidad|Pontificia|Politécnico|Colegio Mayor)\b/i;
const SCHOOL_NAME_RE = /^(Colegio|Gimnasio|Liceo|Instituto)\b/i;

function getCategory(tags: Record<string, string>): AmenityCategory | null {
  const isTransit =
    !!tags.public_transport
    || tags.highway === "bus_stop"
    || tags.amenity === "bus_station"
    || tags.aerialway === "station";
  if (isTransit) return isTransmilenio(tags) ? "transmilenio" : "transport";

  // Universidades: 4 vías de detección, todas válidas.
  // `office=educational_institution` se EXCLUYE a propósito (demasiado amplio).
  if (["university", "college"].includes(tags.amenity)) return "university";
  if (["university", "college"].includes(tags.building)) return "university";
  if (["university", "college", "education"].includes(tags.landuse)) return "university";
  if ((tags.building || tags.landuse) && UNIVERSITY_NAME_RE.test(tags.name || "")) return "university";

  // Colegios: igual estructura — tags formales o nombre con landuse/building.
  if (tags.amenity === "school" || tags.building === "school" || tags.landuse === "school") return "school";
  if ((tags.building || tags.landuse) && SCHOOL_NAME_RE.test(tags.name || "")) return "school";

  // Centros comerciales (separados de supermercados).
  if (["mall", "shopping_centre"].includes(tags.shop)) return "mall";
  // `discount` cubre cadenas como D1, Justo & Bueno, Ara — comunes en Bogotá
  // y a menudo NO tagueadas como supermarket en OSM.
  if (["supermarket", "convenience", "discount"].includes(tags.shop)) return "market";

  // Parques: solo features con nombre se aceptan (la query Overpass ya
  // filtra a `["name"]`, pero defendemos aquí también por si llega data
  // de otro origen).
  if (["park", "garden", "nature_reserve"].includes(tags.leisure) && tags.name) return "park";
  if (tags.landuse === "recreation_ground" && tags.name) return "park";

  if (tags.amenity === "pharmacy") return "pharmacy";
  if (tags.leisure === "fitness_centre") return "gym";
  if (["restaurant", "cafe", "fast_food"].includes(tags.amenity)) return "food";
  if (["bar", "pub", "nightclub"].includes(tags.amenity)) return "nightlife";
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

function diversifyByCategory(
  places: NearbyPlace[],
  maxPerCategory: number,
  totalCap: number,
): NearbyPlace[] {
  const counts: Partial<Record<AmenityCategory, number>> = {};
  const kept: NearbyPlace[] = [];
  // `places` ya viene ordenado por distancia ascendente — recorremos en orden.
  for (const place of places) {
    const used = counts[place.category] ?? 0;
    if (used < maxPerCategory) {
      counts[place.category] = used + 1;
      kept.push(place);
      if (kept.length >= totalCap) break;
    }
  }
  return kept;
}

// Dedup helper: dos nombres "se solapan" si comparten al menos una palabra
// significativa (>4 chars). Evita meter "Universidad Pedagógica Nacional —
// Sede Calle 72" curada cuando OSM ya tenía "Universidad Pedagógica".
function namesOverlap(a: string, b: string): boolean {
  const norm = (s: string) =>
    s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9\s]/g, " ");
  const wordsA = norm(a).split(/\s+/).filter(w => w.length > 4);
  const wordsB = new Set(norm(b).split(/\s+/));
  return wordsA.some(w => wordsB.has(w));
}

// Inyecta POIs del catálogo curado cuando OSM no los devolvió. Garantiza que
// instituciones clave (Pedagógica, Andino, etc.) aparezcan si están dentro
// del radio — independientemente de cómo OSM las tenga mapeadas.
function mergeCuratedPois(
  lat: number,
  lng: number,
  radius: number,
  osmPlaces: NearbyPlace[],
): NearbyPlace[] {
  const result = [...osmPlaces];
  for (const curated of CURATED_POIS) {
    const dist = distanceMeters(lat, lng, curated.lat, curated.lng);
    if (dist > radius) continue;
    const alreadyHave = result.some(
      (p) => p.category === curated.category && namesOverlap(p.name, curated.name),
    );
    if (alreadyHave) continue;
    result.push({
      id: `curated:${curated.category}:${curated.name.replace(/\s+/g, "_")}`,
      name: curated.name,
      category: curated.category,
      categoryLabel: CATEGORY_LABELS[curated.category],
      lat: curated.lat,
      lng: curated.lng,
      distanceMeters: dist,
    });
  }
  return result;
}

function buildSummary(places: NearbyPlace[]): Partial<Record<AmenityCategory, CategorySummary>> {
  const summary: Partial<Record<AmenityCategory, CategorySummary>> = {};
  for (const place of places) {
    const existing = summary[place.category];
    if (!existing) {
      summary[place.category] = {
        count: 1,
        nearest: { name: place.name, distanceMeters: place.distanceMeters },
      };
    } else {
      existing.count += 1;
      if (place.distanceMeters < existing.nearest.distanceMeters) {
        existing.nearest = { name: place.name, distanceMeters: place.distanceMeters };
      }
    }
  }
  return summary;
}

// Fetches and categorizes POIs around a coordinate. Returns an empty result on
// any failure (Overpass down / rate-limited) so callers never crash.
export async function fetchNearbyPois(
  lat: number,
  lng: number,
  radius = 1200,
  signal?: AbortSignal,
): Promise<NearbyResult> {
  const empty: NearbyResult = { radius, places: [], summary: {} };

  try {
    const response = await fetch(OVERPASS_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        "User-Agent": "RentAI/1.0 (rental matching app)",
        Accept: "application/json",
      },
      body: "data=" + encodeURIComponent(buildOverpassQuery(lat, lng, radius)),
      signal,
    });
    if (!response.ok) return empty;

    const data = await response.json();
    const seen = new Set<string>();
    const places: NearbyPlace[] = [];

    for (const item of data.elements || []) {
      const tags = item.tags || {};
      const category = getCategory(tags);
      const placeLat = Number(item.lat ?? item.center?.lat);
      const placeLng = Number(item.lon ?? item.center?.lon);
      if (!category || !Number.isFinite(placeLat) || !Number.isFinite(placeLng)) continue;

      const name = tags.name || CATEGORY_LABELS[category];
      const dedupeKey = `${category}:${name.toLowerCase()}:${placeLat.toFixed(4)},${placeLng.toFixed(4)}`;
      if (seen.has(dedupeKey)) continue;
      seen.add(dedupeKey);

      places.push({
        id: `${item.type}-${item.id}`,
        name,
        category,
        categoryLabel: CATEGORY_LABELS[category],
        lat: placeLat,
        lng: placeLng,
        distanceMeters: distanceMeters(lat, lng, placeLat, placeLng),
      });
    }

    // Inyectamos el catálogo curado ANTES de ordenar y diversificar, para que
    // las instituciones curadas compitan por los slots por igual que las de OSM.
    const merged = mergeCuratedPois(lat, lng, radius, places);
    merged.sort((a, b) => a.distanceMeters - b.distanceMeters);
    // Diversificación por categoría: sin esto, en zonas densas como Chapinero
    // los 60+ restaurantes cercanos copan el cap y dejan fuera categorías
    // escasas pero importantes (TransMilenio, universidades, parques).
    // Permitimos hasta 8 por categoría antes de aplicar el cap global de 80.
    const capped = diversifyByCategory(merged, 8, 80);
    return { radius, places: capped, summary: buildSummary(capped) };
  } catch {
    return empty;
  }
}

// Derives the objective sector-amenity tags from computed POIs. The output
// strings match the tenant's desired_amenities_sector vocabulary so the RPC's
// Jaccard score compares against reality instead of the owner's manual text.
export function deriveSectorAmenities(places: NearbyPlace[]): string[] {
  const within = (category: AmenityCategory) =>
    places.some(
      (p) => p.category === category && p.distanceMeters <= (THRESHOLD_M[category] ?? 600),
    );

  const tags: string[] = [];
  if (within("transmilenio") || within("transport")) tags.push(SECTOR_TAG.transport);
  if (within("university")) tags.push(SECTOR_TAG.university);
  if (within("market")) tags.push(SECTOR_TAG.market);
  if (within("park")) tags.push(SECTOR_TAG.park);
  if (within("pharmacy")) tags.push(SECTOR_TAG.pharmacy);
  if (within("gym")) tags.push(SECTOR_TAG.gym);

  // Nightlife is a presence signal; "Zona tranquila" is its inverse.
  if (within("nightlife")) tags.push(SECTOR_TAG.nightlife);
  else tags.push(SECTOR_TAG.quiet);

  return tags;
}
