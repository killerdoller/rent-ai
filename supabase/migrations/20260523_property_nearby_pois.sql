-- Migration: property_nearby_pois
-- Precomputed surrounding POIs (gyms, pharmacies, TransMilenio, etc.) per property.
-- nearby_pois feeds the explanatory match summary; the derived tags are written
-- into amenities_sector so the existing match_properties Jaccard scores against
-- real-world data instead of the owner's manual text.

ALTER TABLE public.properties
  ADD COLUMN IF NOT EXISTS nearby_pois jsonb,
  ADD COLUMN IF NOT EXISTS nearby_computed_at timestamptz;
