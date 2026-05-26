// Backfills nearby_pois for existing properties that have coordinates.
// Mirrors the categorization in src/utils/nearby.ts (kept in sync manually).
//
// ──────────────────────────────────────────────────────────────────────────────
// WHEN TO RUN THIS
// ──────────────────────────────────────────────────────────────────────────────
// The Next.js owner UI (POST /api/owner/properties) computes POIs inline when
// an owner creates or moves a property. But the Python scraper
// (webscrapper/scraper_to_supabase.py) writes straight to Supabase, skipping
// the API — so any property inserted by the scraper has nearby_pois = NULL
// until this backfill runs.
//
// Run after every scraper batch, or whenever you see properties in the app
// without the "Qué hay alrededor" section in the detail sheet.
//
// ──────────────────────────────────────────────────────────────────────────────
// USAGE  (Node 20.6+ loads the env file natively)
// ──────────────────────────────────────────────────────────────────────────────
//   node --env-file=.env.local scripts/backfill-pois.mjs            # only missing
//   node --env-file=.env.local scripts/backfill-pois.mjs --force    # recompute all
//
// Needs NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local.
// Must run from Windows PowerShell (not WSL) unless Node 20+ is installed in WSL.
//
// ──────────────────────────────────────────────────────────────────────────────
// TROUBLESHOOTING — "fetch failed" on most properties
// ──────────────────────────────────────────────────────────────────────────────
// The public Overpass instance (overpass-api.de) rate-limits aggressively and
// closes TCP connections under load, surfacing as a bare "fetch failed" with
// no HTTP status. This script handles it three ways:
//
//   1. Retry with exponential backoff (2s, 4s, 8s — up to 4 attempts per
//      property) — see fetchNearbyWithRetry below.
//   2. 2-second throttle between properties (THROTTLE_MS) — Overpass asks for
//      light traffic and this keeps us well under the daily 10k cap.
//   3. Idempotent runs — without --force, only NULL nearby_pois are processed,
//      so re-running the script picks up where it left off.
//
// If you still see failures after one run:
//   a) Wait 5–10 minutes (Overpass is likely overloaded) and re-run without
//      --force. Each pass fills more.
//   b) If a property fails 4 times in a single run, it's probably a coordinate
//      issue (off-Bogotá, in the ocean, etc.) — check `latitude`/`longitude`
//      on that property_id in Supabase.
//   c) For a hard outage, https://overpass.kumi.systems/ is a mirror that
//      mostly mirrors the public instance. Swap OVERPASS_ENDPOINT below.
//
// Last-resort manual recovery: open the affected property in /owner/properties
// and re-save it without changes — that triggers /api/owner/properties PATCH
// which re-runs the POI computation for that single row.

import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error("Faltan NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY en el entorno.");
  process.exit(1);
}

const force = process.argv.includes("--force");
const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

const OVERPASS_ENDPOINT = "https://overpass-api.de/api/interpreter";
const THROTTLE_MS = 2000;       // be a good Overpass citizen: ~0.5 req/s
const MAX_ATTEMPTS = 4;         // total tries per property (3 retries after first fail)
const BASE_BACKOFF_MS = 2000;   // exponential: 2s, 4s, 8s

const CATEGORY_LABELS = {
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

const THRESHOLD_M = {
  transmilenio: 800, transport: 600, university: 600, school: 600,
  market: 600, mall: 800, park: 600, pharmacy: 600, gym: 600, nightlife: 600,
};

// Catálogo curado de instituciones de Bogotá. Mantener en sync con
// src/utils/bogotaInstitutions.ts — OSM no es confiable para varias de
// estas universidades grandes, así que las inyectamos manualmente.
const CURATED_POIS = [
  // Universidades
  { name: "Universidad Pedagógica Nacional — Sede Calle 72", category: "university", lat: 4.6605, lng: -74.0700 },
  { name: "Universidad Pedagógica Nacional — Sede Valmaría", category: "university", lat: 4.7245, lng: -74.0517 },
  { name: "Universidad Nacional de Colombia — Ciudad Universitaria", category: "university", lat: 4.6376, lng: -74.0833 },
  { name: "Universidad de los Andes", category: "university", lat: 4.6019, lng: -74.0660 },
  { name: "Pontificia Universidad Javeriana", category: "university", lat: 4.6275, lng: -74.0651 },
  { name: "Universidad Externado de Colombia", category: "university", lat: 4.5973, lng: -74.0727 },
  { name: "Universidad Sergio Arboleda", category: "university", lat: 4.6764, lng: -74.0507 },
  { name: "Universidad El Bosque", category: "university", lat: 4.7060, lng: -74.0420 },
  { name: "Universidad Católica de Colombia", category: "university", lat: 4.6298, lng: -74.0666 },
  { name: "Universidad Jorge Tadeo Lozano", category: "university", lat: 4.6065, lng: -74.0712 },
  { name: "Universidad de la Salle — Centro", category: "university", lat: 4.6151, lng: -74.0721 },
  { name: "Universidad de la Salle — Chapinero", category: "university", lat: 4.6432, lng: -74.0651 },
  { name: "Universidad EAN", category: "university", lat: 4.6796, lng: -74.0541 },
  { name: "Universidad Manuela Beltrán", category: "university", lat: 4.6286, lng: -74.0670 },
  { name: "Universidad Santo Tomás — Sede Aquinate", category: "university", lat: 4.6442, lng: -74.0626 },
  { name: "Universidad Antonio Nariño", category: "university", lat: 4.6122, lng: -74.0700 },
  { name: "Universidad Piloto de Colombia", category: "university", lat: 4.6395, lng: -74.0683 },
  { name: "Politécnico Grancolombiano", category: "university", lat: 4.6447, lng: -74.0710 },
  { name: "Universidad Central", category: "university", lat: 4.6212, lng: -74.0723 },
  { name: "Universidad Distrital — Sede Macarena", category: "university", lat: 4.6261, lng: -74.0696 },
  { name: "Universidad Distrital — Sede Tecnológica", category: "university", lat: 4.5757, lng: -74.1374 },
  { name: "ESAP — Escuela Superior de Administración Pública", category: "university", lat: 4.6275, lng: -74.0670 },
  { name: "Universidad ECCI", category: "university", lat: 4.6294, lng: -74.0686 },
  { name: "Universidad Militar Nueva Granada — Sede Calle 100", category: "university", lat: 4.6883, lng: -74.0489 },
  { name: "Fundación Universitaria Konrad Lorenz", category: "university", lat: 4.6469, lng: -74.0631 },
  { name: "SENA — Distrito Capital (Calle 65)", category: "university", lat: 4.6478, lng: -74.0676 },
  // TransMilenio — estaciones principales (troncal Caracas, NQS, Calle 80, Suba)
  // Troncal Caracas
  { name: "Estación Avenida Jiménez (TransMilenio)", category: "transmilenio", lat: 4.6012, lng: -74.0720 },
  { name: "Estación Calle 26 (TransMilenio)", category: "transmilenio", lat: 4.6203, lng: -74.0703 },
  { name: "Estación Profamilia - Calle 34 (TransMilenio)", category: "transmilenio", lat: 4.6296, lng: -74.0681 },
  { name: "Estación Calle 39 (TransMilenio)", category: "transmilenio", lat: 4.6333, lng: -74.0679 },
  { name: "Estación Calle 45 (TransMilenio)", category: "transmilenio", lat: 4.6376, lng: -74.0669 },
  { name: "Estación Marly (TransMilenio)", category: "transmilenio", lat: 4.6419, lng: -74.0671 },
  { name: "Estación Calle 57 (TransMilenio)", category: "transmilenio", lat: 4.6463, lng: -74.0667 },
  { name: "Estación Calle 63 (TransMilenio)", category: "transmilenio", lat: 4.6521, lng: -74.0664 },
  { name: "Estación Flores - Calle 72 (TransMilenio)", category: "transmilenio", lat: 4.6594, lng: -74.0660 },
  { name: "Estación Calle 76 (TransMilenio)", category: "transmilenio", lat: 4.6635, lng: -74.0660 },
  { name: "Estación Héroes (TransMilenio)", category: "transmilenio", lat: 4.6671, lng: -74.0660 },
  { name: "Estación Calle 85 (TransMilenio)", category: "transmilenio", lat: 4.6707, lng: -74.0620 },
  { name: "Estación Virrey (TransMilenio)", category: "transmilenio", lat: 4.6722, lng: -74.0573 },
  { name: "Estación Calle 100 (TransMilenio)", category: "transmilenio", lat: 4.6878, lng: -74.0577 },
  { name: "Estación Calle 106 (TransMilenio)", category: "transmilenio", lat: 4.7008, lng: -74.0507 },
  { name: "Estación Pepe Sierra (TransMilenio)", category: "transmilenio", lat: 4.7079, lng: -74.0479 },
  { name: "Estación Calle 127 (TransMilenio)", category: "transmilenio", lat: 4.7142, lng: -74.0454 },
  { name: "Estación Calle 142 (TransMilenio)", category: "transmilenio", lat: 4.7298, lng: -74.0454 },
  { name: "Estación Mazurén (TransMilenio)", category: "transmilenio", lat: 4.7489, lng: -74.0492 },
  { name: "Estación Toberín (TransMilenio)", category: "transmilenio", lat: 4.7556, lng: -74.0419 },
  // Eje Ambiental
  { name: "Estación Las Aguas (TransMilenio)", category: "transmilenio", lat: 4.6024, lng: -74.0681 },
  { name: "Estación Museo del Oro (TransMilenio)", category: "transmilenio", lat: 4.6014, lng: -74.0731 },
  // NQS
  { name: "Estación Universidad Nacional (TransMilenio)", category: "transmilenio", lat: 4.6382, lng: -74.0843 },
  { name: "Estación NQS Calle 75 (TransMilenio)", category: "transmilenio", lat: 4.6598, lng: -74.0837 },
  { name: "Estación Polo (TransMilenio)", category: "transmilenio", lat: 4.6648, lng: -74.0828 },
  { name: "Estación NQS Calle 100 (TransMilenio)", category: "transmilenio", lat: 4.6856, lng: -74.0728 },
  // Calle 80
  { name: "Estación Carrera 47 (TransMilenio)", category: "transmilenio", lat: 4.6800, lng: -74.0911 },
  { name: "Estación Granja - Carrera 53 (TransMilenio)", category: "transmilenio", lat: 4.6888, lng: -74.0973 },
  { name: "Estación Minuto de Dios (TransMilenio)", category: "transmilenio", lat: 4.7028, lng: -74.1083 },
  { name: "Estación Quirigua (TransMilenio)", category: "transmilenio", lat: 4.7079, lng: -74.1108 },
  // Suba
  { name: "Estación Suba Calle 95 (TransMilenio)", category: "transmilenio", lat: 4.7135, lng: -74.0773 },
  { name: "Estación Suba TV (TransMilenio)", category: "transmilenio", lat: 4.7299, lng: -74.0805 },
  // Centros comerciales
  { name: "Centro Andino", category: "mall", lat: 4.6677, lng: -74.0530 },
  { name: "El Retiro Centro Comercial", category: "mall", lat: 4.6670, lng: -74.0535 },
  { name: "Atlantis Plaza", category: "mall", lat: 4.6677, lng: -74.0541 },
  { name: "Centro Comercial Unicentro", category: "mall", lat: 4.7027, lng: -74.0419 },
  { name: "Hacienda Santa Bárbara", category: "mall", lat: 4.6928, lng: -74.0294 },
  { name: "Gran Estación", category: "mall", lat: 4.6541, lng: -74.1057 },
  { name: "Salitre Plaza", category: "mall", lat: 4.6557, lng: -74.0989 },
  { name: "Plaza Imperial", category: "mall", lat: 4.7437, lng: -74.0954 },
  { name: "Titán Plaza", category: "mall", lat: 4.6906, lng: -74.0852 },
  { name: "Centro Mayor", category: "mall", lat: 4.5818, lng: -74.1283 },
];

function buildQuery(lat, lng, radius) {
  const a = `around:${radius},${lat},${lng}`;
  // Mantener en sync con src/utils/nearby.ts. Ver la versión TS para detalles
  // sobre por qué se incluye landuse para campus grandes (Pedagógica,
  // Gimnasio Moderno) y por qué se excluye office=educational_institution.
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

function isTransmilenio(tags) {
  const net = `${tags.network || ""} ${tags.operator || ""} ${tags.brand || ""}`.toLowerCase();
  if (net.includes("transmilenio")) return true;
  // Heurística: `public_transport=station` con "Estación" en nombre — en
  // Bogotá esto es casi siempre TransMilenio. SITP usa highway=bus_stop.
  if (tags.public_transport === "station") {
    const name = (tags.name || "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
    if (/\bestacion\b/.test(name)) return true;
  }
  return false;
}

const UNIVERSITY_NAME_RE = /^(Universidad|Pontificia|Politécnico|Colegio Mayor)\b/i;
const SCHOOL_NAME_RE = /^(Colegio|Gimnasio|Liceo|Instituto)\b/i;

function getCategory(tags) {
  const isTransit =
    !!tags.public_transport
    || tags.highway === "bus_stop"
    || tags.amenity === "bus_station"
    || tags.aerialway === "station";
  if (isTransit) return isTransmilenio(tags) ? "transmilenio" : "transport";

  if (["university", "college"].includes(tags.amenity)) return "university";
  if (["university", "college"].includes(tags.building)) return "university";
  if (["university", "college", "education"].includes(tags.landuse)) return "university";
  if ((tags.building || tags.landuse) && UNIVERSITY_NAME_RE.test(tags.name || "")) return "university";

  if (tags.amenity === "school" || tags.building === "school" || tags.landuse === "school") return "school";
  if ((tags.building || tags.landuse) && SCHOOL_NAME_RE.test(tags.name || "")) return "school";

  if (["mall", "shopping_centre"].includes(tags.shop)) return "mall";
  if (["supermarket", "convenience", "discount"].includes(tags.shop)) return "market";

  if (["park", "garden", "nature_reserve"].includes(tags.leisure) && tags.name) return "park";
  if (tags.landuse === "recreation_ground" && tags.name) return "park";

  if (tags.amenity === "pharmacy") return "pharmacy";
  if (tags.leisure === "fitness_centre") return "gym";
  if (["restaurant", "cafe", "fast_food"].includes(tags.amenity)) return "food";
  if (["bar", "pub", "nightclub"].includes(tags.amenity)) return "nightlife";
  return null;
}

function distanceMeters(fromLat, fromLng, toLat, toLng) {
  const R = 6371000;
  const dLat = ((toLat - fromLat) * Math.PI) / 180;
  const dLng = ((toLng - fromLng) * Math.PI) / 180;
  const a = Math.sin(dLat / 2) ** 2 +
    Math.cos((fromLat * Math.PI) / 180) * Math.cos((toLat * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return Math.round(R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
}

function buildSummary(places) {
  const summary = {};
  for (const p of places) {
    if (!summary[p.category]) {
      summary[p.category] = { count: 1, nearest: { name: p.name, distanceMeters: p.distanceMeters } };
    } else {
      summary[p.category].count += 1;
      if (p.distanceMeters < summary[p.category].nearest.distanceMeters) {
        summary[p.category].nearest = { name: p.name, distanceMeters: p.distanceMeters };
      }
    }
  }
  return summary;
}

function deriveSectorAmenities(places) {
  const within = (cat) => places.some((p) => p.category === cat && p.distanceMeters <= (THRESHOLD_M[cat] ?? 600));
  const tags = [];
  if (within("transmilenio") || within("transport")) tags.push("Transporte público");
  if (within("university")) tags.push("Universidades");
  if (within("market")) tags.push("Comercio");
  if (within("park")) tags.push("Parques");
  if (within("pharmacy")) tags.push("Farmacias");
  if (within("gym")) tags.push("Gimnasio cerca");
  if (within("nightlife")) tags.push("Vida nocturna");
  else tags.push("Zona tranquila");
  return tags;
}

async function fetchNearby(lat, lng, radius = 1200) {
  const res = await fetch(OVERPASS_ENDPOINT, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      "User-Agent": "RentAI/1.0 (rental matching app)",
      Accept: "application/json",
    },
    body: "data=" + encodeURIComponent(buildQuery(lat, lng, radius)),
  });
  if (!res.ok) throw new Error(`Overpass ${res.status}`);
  const data = await res.json();

  const seen = new Set();
  const places = [];
  for (const item of data.elements || []) {
    const tags = item.tags || {};
    const category = getCategory(tags);
    const placeLat = Number(item.lat ?? item.center?.lat);
    const placeLng = Number(item.lon ?? item.center?.lon);
    if (!category || !Number.isFinite(placeLat) || !Number.isFinite(placeLng)) continue;
    const name = tags.name || CATEGORY_LABELS[category];
    const key = `${category}:${name.toLowerCase()}:${placeLat.toFixed(4)},${placeLng.toFixed(4)}`;
    if (seen.has(key)) continue;
    seen.add(key);
    places.push({
      id: `${item.type}-${item.id}`, name, category, categoryLabel: CATEGORY_LABELS[category],
      lat: placeLat, lng: placeLng, distanceMeters: distanceMeters(lat, lng, placeLat, placeLng),
    });
  }
  // Inyectar catálogo curado (universidades, malls) ANTES de ordenar y
  // diversificar. Esto garantiza que la Pedagógica y demás aparezcan aunque
  // OSM no las tenga bien tagueadas. Dedup por solapamiento de nombre.
  function namesOverlap(a, b) {
    const norm = (s) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9\s]/g, " ");
    const wordsA = norm(a).split(/\s+/).filter(w => w.length > 4);
    const wordsB = new Set(norm(b).split(/\s+/));
    return wordsA.some(w => wordsB.has(w));
  }
  for (const c of CURATED_POIS) {
    const dist = distanceMeters(lat, lng, c.lat, c.lng);
    if (dist > radius) continue;
    const dup = places.some(p => p.category === c.category && namesOverlap(p.name, c.name));
    if (dup) continue;
    places.push({
      id: `curated:${c.category}:${c.name.replace(/\s+/g, "_")}`,
      name: c.name,
      category: c.category,
      categoryLabel: CATEGORY_LABELS[c.category],
      lat: c.lat,
      lng: c.lng,
      distanceMeters: dist,
    });
  }
  places.sort((a, b) => a.distanceMeters - b.distanceMeters);
  // Diversificación: ver explicación en src/utils/nearby.ts.
  const counts = {};
  const kept = [];
  const MAX_PER_CAT = 8;
  const TOTAL_CAP = 80;
  for (const p of places) {
    const used = counts[p.category] ?? 0;
    if (used < MAX_PER_CAT) {
      counts[p.category] = used + 1;
      kept.push(p);
      if (kept.length >= TOTAL_CAP) break;
    }
  }
  return { radius, places: kept, summary: buildSummary(kept) };
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// Wraps fetchNearby with exponential backoff. Overpass throws a bare
// "fetch failed" (no status) when overloaded, so we can't distinguish 429
// from a TCP drop — treat both the same and just back off.
async function fetchNearbyWithRetry(lat, lng) {
  let lastErr;
  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    try {
      return await fetchNearby(lat, lng);
    } catch (e) {
      lastErr = e;
      if (attempt < MAX_ATTEMPTS) {
        const waitMs = BASE_BACKOFF_MS * Math.pow(2, attempt - 1);
        console.log(`     overpass falló (${e.message}); retry en ${waitMs / 1000}s [${attempt}/${MAX_ATTEMPTS - 1}]`);
        await sleep(waitMs);
      }
    }
  }
  throw lastErr;
}

async function main() {
  let query = supabase
    .from("properties")
    .select("property_id, title, latitude, longitude, nearby_pois")
    .not("latitude", "is", null)
    .not("longitude", "is", null);

  if (!force) query = query.is("nearby_pois", null);

  const { data: props, error } = await query;
  if (error) {
    console.error("Error consultando propiedades:", error.message);
    process.exit(1);
  }

  if (!props?.length) {
    console.log("No hay propiedades por procesar.");
    return;
  }

  console.log(`Procesando ${props.length} propiedad(es)${force ? " (--force)" : ""}...`);
  let ok = 0, failed = 0;

  for (const [i, p] of props.entries()) {
    try {
      const result = await fetchNearbyWithRetry(Number(p.latitude), Number(p.longitude));
      const sector = deriveSectorAmenities(result.places);
      const { error: upErr } = await supabase
        .from("properties")
        .update({
          nearby_pois: result,
          nearby_computed_at: new Date().toISOString(),
          amenities_sector: sector,
        })
        .eq("property_id", p.property_id);
      if (upErr) throw upErr;
      ok++;
      console.log(`  [${i + 1}/${props.length}] ${p.title}: ${result.places.length} POIs → ${sector.join(", ")}`);
    } catch (e) {
      failed++;
      console.warn(`  [${i + 1}/${props.length}] ${p.title}: FALLÓ (${e.message}) — reintentar luego`);
    }
    if (i < props.length - 1) await sleep(THROTTLE_MS);
  }

  console.log(`Listo. OK: ${ok}, fallidas: ${failed}.`);
}

main().catch((e) => { console.error(e); process.exit(1); });
