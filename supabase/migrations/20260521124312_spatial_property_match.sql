-- Migration: spatial_property_match
-- Enable PostGIS and create spatial property matching algorithm

-- 1. Enable PostGIS
CREATE EXTENSION IF NOT EXISTS postgis WITH SCHEMA extensions;

-- 2. Add location to properties
ALTER TABLE public.properties
ADD COLUMN IF NOT EXISTS location extensions.geography(POINT);

-- Backfill location from latitude and longitude
UPDATE public.properties
SET location = extensions.st_point(longitude, latitude)::extensions.geography
WHERE longitude IS NOT NULL AND latitude IS NOT NULL AND location IS NULL;

-- Add spatial index
CREATE INDEX IF NOT EXISTS idx_properties_location ON public.properties USING GIST (location);

-- 3. Add search preference fields to profiles
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS target_location extensions.geography(POINT),
ADD COLUMN IF NOT EXISTS search_radius_meters integer DEFAULT 5000,
ADD COLUMN IF NOT EXISTS desired_amenities_sector text[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS desired_amenities_interior text[] DEFAULT '{}';

-- 4. Create the match_properties RPC Function
CREATE OR REPLACE FUNCTION public.match_properties(p_user_id uuid)
RETURNS TABLE (
  property_id uuid,
  match_score_percentage float,
  distance_meters float
) AS $$
DECLARE
  v_tenant RECORD;
BEGIN
  -- Get tenant info
  SELECT * INTO v_tenant FROM public.profiles WHERE id = p_user_id;

  IF v_tenant IS NULL THEN
    RETURN;
  END IF;

  RETURN QUERY
  SELECT 
    p.property_id,
    (
      -- Spatial Score (50%)
      (
        CASE 
          WHEN v_tenant.target_location IS NULL OR p.location IS NULL THEN 0.5 -- Default 50% if no coords
          ELSE GREATEST(0, 1.0 - (ST_Distance(p.location, v_tenant.target_location) / GREATEST(1, v_tenant.search_radius_meters)))
        END
      ) * 0.50 +
      
      -- Sector Amenities Jaccard Score (25%)
      (
        SELECT 
          CASE WHEN array_length(v_tenant.desired_amenities_sector, 1) IS NULL THEN 1.0 -- If tenant doesn't care, score 100%
          ELSE COALESCE(
            (SELECT COUNT(*)::float FROM unnest(p.amenities_sector) a JOIN unnest(v_tenant.desired_amenities_sector) b ON a = b) /
            NULLIF((SELECT COUNT(*)::float FROM (SELECT unnest(p.amenities_sector) UNION SELECT unnest(v_tenant.desired_amenities_sector)) u), 0)
          , 0.0) END
      ) * 0.25 +
      
      -- Interior Amenities Jaccard Score (25%)
      (
        SELECT 
          CASE WHEN array_length(v_tenant.desired_amenities_interior, 1) IS NULL THEN 1.0
          ELSE COALESCE(
            (SELECT COUNT(*)::float FROM unnest(p.amenities_interior) a JOIN unnest(v_tenant.desired_amenities_interior) b ON a = b) /
            NULLIF((SELECT COUNT(*)::float FROM (SELECT unnest(p.amenities_interior) UNION SELECT unnest(v_tenant.desired_amenities_interior)) u), 0)
          , 0.0) END
      ) * 0.25
    ) * 100 AS match_score_percentage,
    
    -- Distance
    CASE 
      WHEN v_tenant.target_location IS NULL OR p.location IS NULL THEN NULL 
      ELSE ST_Distance(p.location, v_tenant.target_location) 
    END AS distance_meters
    
  FROM public.properties p
  WHERE 
    p.monthly_rent BETWEEN COALESCE(v_tenant.min_budget, 0) AND COALESCE(v_tenant.max_budget, 999999999)
  ORDER BY match_score_percentage DESC
  LIMIT 50;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
