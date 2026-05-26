-- Migration: set_profile_target
-- Writing a PostGIS geography column directly through the REST API is awkward,
-- so this helper takes plain lat/lng and stores the search-center point. The
-- /api/profile route calls it whenever the tenant's desired zones are geocoded.
-- This activates the 50% spatial weight in match_properties, which otherwise
-- defaults to a neutral 0.5 when target_location is null.

CREATE OR REPLACE FUNCTION public.set_profile_target(
  p_user_id uuid,
  p_lat double precision,
  p_lng double precision
) RETURNS void AS $$
  UPDATE public.profiles
  SET target_location = extensions.st_point(p_lng, p_lat)::extensions.geography
  WHERE id = p_user_id;
$$ LANGUAGE sql SECURITY DEFINER;
