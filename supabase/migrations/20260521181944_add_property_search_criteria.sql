-- Migration: Add Property Search Criteria (Localidades, Tipos de Propiedad, Barrios)

-- 1. Actualizar tabla properties
ALTER TABLE public.properties
ADD COLUMN IF NOT EXISTS property_type text, -- 'Casa', 'Apartamento', 'Habitación'
ADD COLUMN IF NOT EXISTS localidad text; -- 'Usaquén', 'Chapinero', etc.

-- 2. Actualizar tabla profiles
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS desired_property_types text[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS desired_localities text[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS desired_neighborhoods text[] DEFAULT '{}';

-- Nota: custom amenities ya son soportadas porque "tags" en properties 
-- y "desired_amenities_..." en profiles son de tipo text[], 
-- por lo que cualquier string se puede insertar.
