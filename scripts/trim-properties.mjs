// Deletes the N least-complete properties from the DB and their storage images.
// Keeps the rest intact.
//
// Completeness score: coords (3pts) + description (2pts) + amenities (2pts)
//                     + multiple images (1pt) + address (1pt)
// The lowest-scoring properties are deleted first.
//
// USAGE (Node 20.6+):
//   node --env-file=.env.local scripts/trim-properties.mjs              # dry-run, delete 65
//   node --env-file=.env.local scripts/trim-properties.mjs --delete     # execute
//   node --env-file=.env.local scripts/trim-properties.mjs --n=80       # override count

import { createClient } from "@supabase/supabase-js";

const DRY_RUN  = !process.argv.includes("--delete");
const N_ARG    = process.argv.find(a => a.startsWith("--n="));
const DELETE_N = N_ARG ? parseInt(N_ARG.split("=")[1]) : 65;
const BUCKET   = "property-images";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
);

// ── Completeness score (higher = better) ─────────────────────────────────────
function score(p) {
  let s = 0;
  if (p.latitude && p.longitude)                   s += 3;
  if (p.description && p.description.length > 30)  s += 2;
  if (p.amenities_interior?.length > 0)            s += 1;
  if (p.amenities_sector?.length > 0)              s += 1;
  if (p.images?.length > 1)                        s += 1;
  if (p.address && p.address.length > 5)           s += 1;
  return s;
}

// ── Select the N worst properties to delete ───────────────────────────────────
async function selectDeleteSet() {
  const { data, error } = await supabase
    .from("properties")
    .select("property_id, neighborhood, latitude, longitude, description, amenities_interior, amenities_sector, images, address");

  if (error) throw new Error(`DB error: ${error.message}`);

  // Sort ascending by score → worst first
  const sorted    = [...data].sort((a, b) => score(a) - score(b));
  const deleteSet = sorted.slice(0, DELETE_N);
  const keepCount = data.length - deleteSet.length;

  return { deleteSet, keepCount, total: data.length };
}

// ── Extract storage path from public URL ─────────────────────────────────────
function urlToPath(url) {
  if (!url) return null;
  const marker = `/object/public/${BUCKET}/`;
  const idx    = url.indexOf(marker);
  return idx !== -1 ? decodeURIComponent(url.slice(idx + marker.length)) : null;
}

// ── Collect storage paths for a list of properties ───────────────────────────
async function collectPaths(properties) {
  const ids  = properties.map(p => p.property_id);
  const paths = [];

  // Fetch in one query instead of N individual queries
  const { data } = await supabase
    .from("properties")
    .select("image_url, images")
    .in("property_id", ids);

  for (const row of data ?? []) {
    const urls = [row.image_url, ...(row.images ?? [])].filter(Boolean);
    for (const url of urls) {
      const path = urlToPath(url);
      if (path) paths.push(path);
    }
  }
  return paths;
}

// ── Delete storage files ──────────────────────────────────────────────────────
async function deleteStorageFiles(paths) {
  if (paths.length === 0) return 0;
  const BATCH = 100;
  let deleted = 0;
  for (let i = 0; i < paths.length; i += BATCH) {
    const { error } = await supabase.storage.from(BUCKET).remove(paths.slice(i, i + BATCH));
    if (error) console.error(`  Storage error: ${error.message}`);
    else deleted += Math.min(BATCH, paths.length - i);
  }
  return deleted;
}

// ── Delete DB rows (dependent tables first) ───────────────────────────────────
async function deletePropertyRows(ids) {
  if (ids.length === 0) return;
  for (const table of ["property_likes", "property_rejections", "owner_tenant_likes", "property_matches"]) {
    const { error } = await supabase.from(table).delete().in("property_id", ids);
    if (error && !error.message.includes("does not exist")) {
      console.warn(`  Warning (${table}): ${error.message}`);
    }
  }
  const { error } = await supabase.from("properties").delete().in("property_id", ids);
  if (error) throw new Error(`Failed to delete properties: ${error.message}`);
}

// ── Main ──────────────────────────────────────────────────────────────────────
async function main() {
  console.log(`Mode     : ${DRY_RUN ? "DRY-RUN (add --delete to execute)" : "DELETE"}`);
  console.log(`Delete N : ${DELETE_N}\n`);

  console.log("Scoring properties...");
  const { deleteSet, keepCount, total } = await selectDeleteSet();

  console.log(`  Total in DB    : ${total}`);
  console.log(`  Will keep      : ${keepCount}`);
  console.log(`  Will delete    : ${deleteSet.length}`);

  const paths = await collectPaths(deleteSet);
  console.log(`  Storage files  : ~${paths.length} images to remove\n`);

  console.log("Properties that WILL BE DELETED (lowest completeness score):");
  for (const p of deleteSet.slice(0, 15)) {
    console.log(`  [DEL score=${score(p)}] ${(p.neighborhood || "?").padEnd(22)} ${p.address || p.property_id}`);
  }
  if (deleteSet.length > 15) console.log(`  ... and ${deleteSet.length - 15} more`);

  if (DRY_RUN) {
    console.log("\nDry-run complete. Run with --delete to execute.");
    return;
  }

  const ids = deleteSet.map(p => p.property_id);

  console.log("\nDeleting storage images...");
  const filesRemoved = await deleteStorageFiles(paths);
  console.log(`  Removed ${filesRemoved} file(s)`);

  console.log("Deleting property records...");
  await deletePropertyRows(ids);
  console.log(`  Deleted ${ids.length} properties\n`);

  console.log(`Done. ${keepCount} properties remain.`);
}

main().catch(err => { console.error(err); process.exit(1); });
