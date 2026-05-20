-- Migration: add_property_details
-- Add detailed fields for property listings (type, floors, area, separated amenities)

ALTER TABLE public.properties
    ADD COLUMN IF NOT EXISTS property_type text,
    ADD COLUMN IF NOT EXISTS bathrooms integer,
    ADD COLUMN IF NOT EXISTS area_sqm numeric,
    ADD COLUMN IF NOT EXISTS stratum integer,
    ADD COLUMN IF NOT EXISTS floor_number integer,
    ADD COLUMN IF NOT EXISTS building_floors integer,
    ADD COLUMN IF NOT EXISTS amenities_interior text[] DEFAULT '{}',
    ADD COLUMN IF NOT EXISTS amenities_exterior text[] DEFAULT '{}',
    ADD COLUMN IF NOT EXISTS amenities_sector text[] DEFAULT '{}',
    ADD COLUMN IF NOT EXISTS utilities_included text[] DEFAULT '{}';
