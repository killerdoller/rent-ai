// Identifies and removes orphaned files from the `property-images` bucket.
// An orphaned file is one that no property in the DB references (via image_url
// or the images[] array).
//
// USAGE (Node 20.6+):
//   node --env-file=.env.local scripts/cleanup-storage.mjs            # dry-run (preview only)
//   node --env-file=.env.local scripts/cleanup-storage.mjs --delete   # actually delete
//
// Always run dry-run first to review what will be removed.

import { createClient } from "@supabase/supabase-js";

const DRY_RUN = !process.argv.includes("--delete");
const BUCKET  = "property-images";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
);

// ── 1. Collect all storage file paths (root + subfolders) ────────────────────

async function listFolder(folder) {
  const files = [];
  let offset  = 0;
  const limit = 1000;

  while (true) {
    const { data, error } = await supabase.storage
      .from(BUCKET)
      .list(folder, { limit, offset, sortBy: { column: "name", order: "asc" } });

    if (error) throw new Error(`Storage list error (${folder || "root"}): ${error.message}`);
    if (!data || data.length === 0) break;

    for (const item of data) {
      const path = folder ? `${folder}/${item.name}` : item.name;
      if (item.id === null) {
        // It's a folder — recurse
        files.push(...await listFolder(path));
      } else {
        files.push(path);
      }
    }

    if (data.length < limit) break;
    offset += limit;
  }

  return files;
}

async function listAllFiles() {
  return listFolder("");
}

// ── 2. Collect all URLs referenced in the DB ─────────────────────────────────

async function referencedPaths(bucketUrl) {
  const { data, error } = await supabase
    .from("properties")
    .select("image_url, images");

  if (error) throw new Error(`DB query error: ${error.message}`);

  const paths = new Set();

  for (const row of data ?? []) {
    const urls = [row.image_url, ...(row.images ?? [])].filter(Boolean);
    for (const url of urls) {
      // Convert full public URL → storage path (everything after /object/public/bucket-name/)
      const marker = `/object/public/${BUCKET}/`;
      const idx    = url.indexOf(marker);
      if (idx !== -1) paths.add(decodeURIComponent(url.slice(idx + marker.length)));
    }
  }

  return paths;
}

// ── 3. Main ───────────────────────────────────────────────────────────────────

async function main() {
  console.log(`Mode: ${DRY_RUN ? "DRY-RUN (add --delete to actually remove)" : "DELETE"}\n`);

  const { data: { publicUrl: sampleUrl } } = supabase.storage.from(BUCKET).getPublicUrl("__probe__");
  // Extract bucket base URL
  const bucketUrl = sampleUrl.replace("/__probe__", "");

  console.log("Listing storage files...");
  const allFiles = await listAllFiles();
  console.log(`  ${allFiles.length} file(s) in bucket`);

  console.log("Querying DB references...");
  const referenced = await referencedPaths(bucketUrl);
  console.log(`  ${referenced.size} unique path(s) referenced by properties\n`);

  const orphans = allFiles.filter(path => !referenced.has(path));

  if (orphans.length === 0) {
    console.log("No orphaned files found. Storage is clean.");
    return;
  }

  // Estimate size savings (we can only know file count without Storage API v2)
  console.log(`Found ${orphans.length} orphaned file(s):\n`);
  for (const p of orphans) console.log(`  - ${p}`);

  if (DRY_RUN) {
    console.log("\nDry-run complete. Run with --delete to remove these files.");
    return;
  }

  // Delete in batches of 100 (Supabase limit per call)
  const BATCH = 100;
  let deleted = 0;
  for (let i = 0; i < orphans.length; i += BATCH) {
    const batch  = orphans.slice(i, i + BATCH);
    const { error } = await supabase.storage.from(BUCKET).remove(batch);
    if (error) {
      console.error(`Error deleting batch: ${error.message}`);
    } else {
      deleted += batch.length;
      console.log(`Deleted ${deleted}/${orphans.length}...`);
    }
  }

  console.log(`\nDone. Removed ${deleted} orphaned file(s).`);
}

main().catch(err => { console.error(err); process.exit(1); });
