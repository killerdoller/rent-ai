// Backfills `properties.neighborhood` para corregir el caso donde el scraper
// guardó la LOCALIDAD como barrio (porque FincaRaíz no expone consistentemente
// el barrio en el JSON estructurado).
//
// ──────────────────────────────────────────────────────────────────────────────
// ESTRATEGIA (analizada empíricamente sobre data real de FincaRaíz)
// ──────────────────────────────────────────────────────────────────────────────
// 1. La LOCALIDAD ya está bien en la BD — viene de `locations.location_main.name`
//    del JSON, que sí es confiable. NO la tocamos a menos que esté NULL.
// 2. El BARRIO real aparece en dos lugares del listado:
//    - Título: "Apartamento en Arriendo en [BARRIO], Bogotá"
//    - Descripción: "ubicado en X", "barrio X", "se encuentra en X"
// 3. Nominatim NO sirve para barrios en Bogotá — devuelve UPZs o el meta-término
//    "UPZs de Bogotá". Confirmado empíricamente. NO se llama.
// 4. La fuente de verdad es la lista canónica de barrios en bogotaZones.ts.
//    Buscamos coincidencias word-boundary case-sensitive (Title Case o ALL CAPS)
//    dentro del título + descripción.
//
// ──────────────────────────────────────────────────────────────────────────────
// USO
// ──────────────────────────────────────────────────────────────────────────────
//   node --env-file=.env.local scripts/backfill-neighborhoods.mjs           # solo sospechosas
//   node --env-file=.env.local scripts/backfill-neighborhoods.mjs --force   # todas
//   node --env-file=.env.local scripts/backfill-neighborhoods.mjs --dry-run # preview

import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error("Faltan NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY.");
  process.exit(1);
}

const force = process.argv.includes("--force");
const dryRun = process.argv.includes("--dry-run");
const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

// ──────────────────────────────────────────────────────────────────────────────
// Catálogo de localidades + barrios. Mantener en sync con src/utils/bogotaZones.ts
// ──────────────────────────────────────────────────────────────────────────────

const LOCALIDADES_CANONICAS = [
  "Usaquén", "Chapinero", "Santa Fe", "San Cristóbal", "Usme", "Tunjuelito",
  "Bosa", "Kennedy", "Fontibón", "Engativá", "Suba", "Barrios Unidos",
  "Teusaquillo", "Los Mártires", "Antonio Nariño", "Puente Aranda",
  "La Candelaria", "Rafael Uribe Uribe", "Ciudad Bolívar", "Sumapaz",
];

const NEIGHBORHOODS_BY_LOCALITY = {
  "Usaquén": ["Santa Bárbara", "Country Club", "Cedritos", "Toberín", "San Cristóbal Norte", "Verbenal", "Usaquén Centro", "Bella Suiza", "Santa Ana", "La Carolina", "Lijacá", "Country Sur"],
  "Chapinero": ["El Chicó", "El Nogal", "El Refugio", "El Retiro", "La Cabrera", "Los Rosales", "Quinta Camacho", "Chapinero Central", "Chapinero Alto", "La Salle", "El Castillo", "Antiguo Country", "La Porciúncula", "Sucre", "Pardo Rubio", "Marly", "San Luis", "Bellavista"],
  "Santa Fe": ["La Macarena", "La Perseverancia", "Las Aguas", "Santa Fe Centro", "Bosque Izquierdo", "Cruces", "Las Nieves"],
  "San Cristóbal": ["20 de Julio", "La Victoria", "San Blas", "Sosiego", "Velódromo", "La Gloria", "Altamira"],
  "Usme": ["Usme Centro", "La Esperanza", "Yomasa", "Comuneros", "Danubio", "Gran Yomasa"],
  "Tunjuelito": ["Tunjuelito Centro", "Venecia", "Tunal", "Muzú", "San Carlos"],
  "Bosa": ["Bosa Centro", "Bosa La Estación", "Apogeo", "Porvenir", "Holanda", "El Recreo"],
  "Kennedy": ["Castilla", "Banderas", "Kennedy Central", "Patio Bonito", "Tintal", "Timiza", "Class", "Marsella", "Britalia"],
  "Fontibón": ["Fontibón Centro", "Modelia", "Hayuelos", "Versalles", "Capellanía", "Ciudad Hayuelos", "El Refugio"],
  "Engativá": ["Boyacá Real", "Bolivia", "La Granja", "Engativá Centro", "Las Ferias", "Bellavista", "Florida", "Villa Luz", "Normandía"],
  "Suba": ["Niza", "Mazurén", "Britalia", "Pinar de Suba", "Suba Centro", "Tibabuyes", "Salitre Norte", "El Rincón", "Aures", "La Campiña", "La Carolina", "Casa Blanca"],
  "Barrios Unidos": ["Polo Club", "Los Andes", "La Castellana", "La Patria", "Modelo", "Once de Noviembre", "Alcázares", "Concepción Norte"],
  "Teusaquillo": ["Galerías", "La Soledad", "Teusaquillo Centro", "Quinta Paredes", "Pablo VI", "Sears", "Ciudad Salitre", "Belalcázar", "La Estrella"],
  "Los Mártires": ["Santa Isabel", "Voto Nacional", "La Sabana", "San Victorino", "Ricaurte", "La Pepita"],
  "Antonio Nariño": ["Restrepo", "San Antonio", "Ciudad Berna", "Olaya", "Eduardo Santos"],
  "Puente Aranda": ["Centro Industrial", "Ciudad Montes", "Puente Aranda Centro", "Salazar Gómez", "La Esperanza Sur", "Pensilvania"],
  "La Candelaria": ["La Candelaria", "Egipto", "Belén", "Centro Histórico"],
  "Rafael Uribe Uribe": ["Quiroga", "San José", "Marruecos", "Diana Turbay", "Olaya"],
  "Ciudad Bolívar": ["Lucero", "Ismael Perdomo", "Jerusalén", "San Francisco", "El Tesoro", "Arborizadora"],
  "Sumapaz": ["Nazareth", "San Juan"],
};

// ──────────────────────────────────────────────────────────────────────────────
// Normalización
// ──────────────────────────────────────────────────────────────────────────────

function stripAccentsLower(s) {
  return (s || "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
}

function stripAccentsKeepCase(s) {
  return (s || "").normalize("NFD").replace(/[̀-ͯ]/g, "");
}

// EXACT match. Antes usábamos `.includes()` y eso clasificaba "Chapinero Alto"
// como localidad "Chapinero" — bug que hacía perder barrios válidos.
function normalizeLocalidad(raw) {
  if (!raw) return null;
  const rawNorm = stripAccentsLower(raw).trim();
  for (const canonical of LOCALIDADES_CANONICAS) {
    if (stripAccentsLower(canonical) === rawNorm) return canonical;
  }
  return null;
}

// Parsea el título de FincaRaíz: "Apartamento en Arriendo en [ZONA], Bogotá".
// Devuelve la ZONA raw (sin canonicalizar) — puede ser barrio o localidad.
function extractZoneFromTitle(title) {
  if (!title) return null;
  const m = title.match(/\ben\s+(?:Arriendo|Venta|Renta)\s+en\s+(.+?)(?:,\s*Bogot[áa]|$)/i);
  if (!m) return null;
  let text = m[1].trim();
  text = text.replace(/^Zona\s+/i, ""); // "Zona Chapinero" → "Chapinero"
  return text;
}

// Clasifica una zona como barrio o localidad usando los catálogos canónicos.
function classifyZone(zone) {
  if (!zone) return { neighborhood: null, localidad: null };
  const asLocalidad = normalizeLocalidad(zone);
  if (asLocalidad) return { neighborhood: null, localidad: asLocalidad };
  const asBarrio = canonicalizeBarrio(zone);
  if (asBarrio) return { neighborhood: asBarrio, localidad: null };
  return { neighborhood: null, localidad: null };
}

// Reverse lookup: dado un barrio canónico, devuelve su localidad.
function localityForBarrio(barrio) {
  if (!barrio) return null;
  const norm = stripAccentsLower(barrio);
  for (const [loc, hoods] of Object.entries(NEIGHBORHOODS_BY_LOCALITY)) {
    if (hoods.some(h => stripAccentsLower(h) === norm)) return loc;
  }
  return null;
}

function canonicalizeBarrio(raw) {
  if (!raw) return null;
  const norm = stripAccentsLower(raw);
  for (const hoods of Object.values(NEIGHBORHOODS_BY_LOCALITY)) {
    for (const h of hoods) {
      if (stripAccentsLower(h) === norm) return h;
    }
  }
  return null;
}

// ──────────────────────────────────────────────────────────────────────────────
// Búsqueda de barrios canónicos en texto (título + descripción)
// ──────────────────────────────────────────────────────────────────────────────

function escapeRegex(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

// Match en DESCRIPCIÓN: requiere contexto de ubicación ("en X", "barrio X",
// "sector X", "zona X"). Case-insensitive y accent-insensitive. El contexto
// evita falsos positivos: "modelo de cocina" NO matchea el barrio Modelo,
// pero "barrio Modelo" SÍ.
function descriptionMentionsBarrio(textNoAccLower, barrio) {
  const escaped = escapeRegex(stripAccentsLower(barrio));
  const patterns = [
    `\\ben\\s+(?:el\\s+barrio\\s+)?${escaped}\\b`,
    `\\bbarrio\\s+(?:el\\s+|la\\s+|los\\s+|las\\s+)?${escaped}\\b`,
    `\\bsector\\s+(?:el\\s+|la\\s+)?${escaped}\\b`,
    `\\bzona\\s+(?:de\\s+)?${escaped}\\b`,
    `\\bubicad[oa]\\s+en\\s+(?:el\\s+barrio\\s+)?${escaped}\\b`,
    `\\bse\\s+encuentra\\s+en\\s+(?:el\\s+barrio\\s+)?${escaped}\\b`,
  ];
  for (const pat of patterns) {
    if (new RegExp(pat).test(textNoAccLower)) return true;
  }
  return false;
}

// Busca un barrio canónico en la descripción (con contexto de ubicación).
// Devuelve el barrio canónico encontrado o null. Prefiere primero los barrios
// de la localidad indicada, y dentro de cada lista los más LARGOS primero
// (para que "Chapinero Central" gane sobre un hipotético "Central").
function findBarrioInDescription(description, preferLocality) {
  if (!description) return null;
  const textNoAccLower = stripAccentsLower(description);

  function tryGroup(hoods) {
    const sorted = [...hoods].sort((a, b) => b.length - a.length);
    for (const barrio of sorted) {
      if (descriptionMentionsBarrio(textNoAccLower, barrio)) return barrio;
    }
    return null;
  }

  if (preferLocality && NEIGHBORHOODS_BY_LOCALITY[preferLocality]) {
    const r = tryGroup(NEIGHBORHOODS_BY_LOCALITY[preferLocality]);
    if (r) return r;
  }
  for (const [loc, hoods] of Object.entries(NEIGHBORHOODS_BY_LOCALITY)) {
    if (loc === preferLocality) continue;
    const r = tryGroup(hoods);
    if (r) return r;
  }
  return null;
}

// ──────────────────────────────────────────────────────────────────────────────
// Lógica de decisión (sin Nominatim, sin red)
// ──────────────────────────────────────────────────────────────────────────────

function decideValues(p) {
  // Respetar localidad existente si es válida — el usuario confirmó que
  // está casi siempre bien en la BD.
  const existingValidLocalidad = normalizeLocalidad(p.localidad);

  // 1. Título primero — el patrón "en [Arriendo|Venta|Renta] en [ZONA], Bogotá"
  //    es estructurado y confiable. Casi siempre la zona es el barrio o la
  //    localidad. Aquí matcheamos contra los catálogos canónicos.
  const titleZone = extractZoneFromTitle(p.title);
  const fromTitle = classifyZone(titleZone);

  // 2. Descripción — solo si el título no nos dio barrio. Usa contexto de
  //    ubicación ("en X", "barrio X", etc.) para evitar falsos positivos.
  let barrioFromDesc = null;
  if (!fromTitle.neighborhood && p.description) {
    const preferLocality = existingValidLocalidad || fromTitle.localidad;
    barrioFromDesc = findBarrioInDescription(p.description, preferLocality);
  }

  // 3. Barrio existente — preservar solo si NO es una localidad mal puesta.
  //    Con normalizeLocalidad estricta, "Chapinero Alto" NO es localidad,
  //    así que se conserva como barrio válido.
  const existingIsLocalidad = normalizeLocalidad(p.neighborhood) !== null;
  const existingUsable = (p.neighborhood && !existingIsLocalidad)
    ? (canonicalizeBarrio(p.neighborhood) || p.neighborhood)
    : null;

  const newNeighborhood = fromTitle.neighborhood || barrioFromDesc || existingUsable || null;

  // 4. Localidad: existing → del título → derivada del barrio.
  const newLocalidad =
    existingValidLocalidad
    || fromTitle.localidad
    || localityForBarrio(newNeighborhood);

  return { neighborhood: newNeighborhood, localidad: newLocalidad };
}

// ──────────────────────────────────────────────────────────────────────────────
// Main
// ──────────────────────────────────────────────────────────────────────────────

function isSuspect(p) {
  // El neighborhood es realmente una localidad mal puesta, o falta info.
  if (!p.neighborhood) return true;
  if (normalizeLocalidad(p.neighborhood)) return true;
  if (!p.localidad) return true;
  return false;
}

async function main() {
  const { data: allProps, error } = await supabase
    .from("properties")
    .select("property_id, title, description, neighborhood, localidad");

  if (error) {
    console.error("Error consultando propiedades:", error.message);
    process.exit(1);
  }

  const props = force ? allProps : (allProps || []).filter(isSuspect);
  if (!props.length) {
    console.log(force ? "No hay propiedades." : "No hay propiedades sospechosas.");
    return;
  }

  console.log(
    `${dryRun ? "[DRY RUN] " : ""}Procesando ${props.length} propiedad(es)` +
    `${force ? " (--force)" : " (solo sospechosas)"}...`,
  );

  let updated = 0, unchanged = 0, noMatch = 0;

  for (const [i, p] of props.entries()) {
    const { neighborhood: newNeigh, localidad: newLoc } = decideValues(p);

    if (newNeigh === p.neighborhood && newLoc === p.localidad) {
      unchanged++;
      const noMsg = !newNeigh ? " (no se encontró barrio en el texto)" : "";
      console.log(`  [${i + 1}/${props.length}] ${p.title}: sin cambios${noMsg}`);
      if (!newNeigh) noMatch++;
      continue;
    }

    const changes = [];
    if (newNeigh !== p.neighborhood) changes.push(`barrio "${p.neighborhood}" → "${newNeigh}"`);
    if (newLoc !== p.localidad) changes.push(`localidad "${p.localidad}" → "${newLoc}"`);
    console.log(`  [${i + 1}/${props.length}] ${p.title}: ${changes.join(", ")}`);

    if (!dryRun) {
      const { error: upErr } = await supabase
        .from("properties")
        .update({ neighborhood: newNeigh, localidad: newLoc })
        .eq("property_id", p.property_id);
      if (upErr) {
        console.warn(`    fallo al actualizar: ${upErr.message}`);
        continue;
      }
    }
    updated++;
  }

  console.log(
    `\nListo. Actualizadas: ${updated}, sin cambios: ${unchanged}` +
    `${noMatch > 0 ? ` (${noMatch} de esas no tenían barrio identificable en el texto)` : ""}` +
    `${dryRun ? " — DRY RUN, nada se escribió" : ""}.`,
  );
}

main().catch((e) => { console.error(e); process.exit(1); });
