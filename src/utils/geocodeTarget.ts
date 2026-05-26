// Geocodes a tenant's chosen zones into a single search-center coordinate,
// which becomes the profile's target_location and drives the 50% spatial
// weight of the property match score. Client-side only (uses the relative
// /api/maps/geocode). Best-effort: returns null if nothing resolves.

async function geocodeAll(zones: readonly string[]): Promise<{ lat: number; lng: number }[]> {
  if (!zones || zones.length === 0) return [];
  const coords = await Promise.all(
    zones.map(async (name) => {
      try {
        const r = await fetch(
          `/api/maps/geocode?q=${encodeURIComponent(name)}&city=${encodeURIComponent("Bogotá, Colombia")}`,
        );
        if (!r.ok) return null;
        const d = await r.json();
        const hit = d.results?.[0];
        return hit && Number.isFinite(hit.lat) && Number.isFinite(hit.lng)
          ? { lat: hit.lat as number, lng: hit.lng as number }
          : null;
      } catch {
        return null;
      }
    }),
  );
  return coords.filter((c): c is { lat: number; lng: number } => c !== null);
}

/**
 * Compute a weighted centroid from localities + neighborhoods.
 *
 * Rationale: a user knows the locality of Bogotá they want to live in much
 * more reliably than they know specific barrios — barrios are a refinement.
 * So localities anchor the search center more strongly, with barrios pulling
 * it toward specific areas within. When only one of the two is provided, it
 * gets full weight.
 *
 * Default split: 60% locality, 40% neighborhood. Within each group, points
 * are averaged uniformly (each barrio contributes equally to the 40%).
 */
export async function geocodeWeightedTarget(input: {
  localities: readonly string[];
  neighborhoods: readonly string[];
  localityWeight?: number;
  neighborhoodWeight?: number;
}): Promise<{ lat: number; lng: number } | null> {
  const [locCoords, hoodCoords] = await Promise.all([
    geocodeAll(input.localities),
    geocodeAll(input.neighborhoods),
  ]);

  const hasLoc = locCoords.length > 0;
  const hasHood = hoodCoords.length > 0;
  if (!hasLoc && !hasHood) return null;

  // When only one group resolves, give it 100%.
  const wLoc = hasHood ? (input.localityWeight ?? 0.6) : 1;
  const wHood = hasLoc ? (input.neighborhoodWeight ?? 0.4) : 1;

  const points: Array<{ lat: number; lng: number; w: number }> = [];
  if (hasLoc) {
    const wEach = wLoc / locCoords.length;
    for (const c of locCoords) points.push({ ...c, w: wEach });
  }
  if (hasHood) {
    const wEach = wHood / hoodCoords.length;
    for (const c of hoodCoords) points.push({ ...c, w: wEach });
  }

  const totalW = points.reduce((s, p) => s + p.w, 0);
  return {
    lat: points.reduce((s, p) => s + p.lat * p.w, 0) / totalW,
    lng: points.reduce((s, p) => s + p.lng * p.w, 0) / totalW,
  };
}

/**
 * Legacy single-list geocoder. Kept for any caller that hasn't migrated to
 * `geocodeWeightedTarget`. New code should prefer the weighted version.
 */
export async function geocodeZonesToTarget(
  zones: string[],
): Promise<{ lat: number; lng: number } | null> {
  const coords = await geocodeAll(zones);
  if (coords.length === 0) return null;
  return {
    lat: coords.reduce((s, c) => s + c.lat, 0) / coords.length,
    lng: coords.reduce((s, c) => s + c.lng, 0) / coords.length,
  };
}
