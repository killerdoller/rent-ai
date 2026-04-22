-- Migration: add_location_fields
-- Agrega dirección y coordenadas a properties para mostrar mapa con Leaflet.

ALTER TABLE public.properties
    ADD COLUMN IF NOT EXISTS address text,
    ADD COLUMN IF NOT EXISTS latitude  double precision,
    ADD COLUMN IF NOT EXISTS longitude double precision;
