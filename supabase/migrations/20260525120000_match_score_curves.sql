-- Migration: match_score_curves
--
-- Cambios al algoritmo de scoring para que los porcentajes reflejen mejor
-- la percepción de "compatibilidad" del usuario:
--
-- 1) Decaimiento espacial CUADRÁTICO en vez de lineal.
--    Lineal castiga muy fuerte distancias intermedias: una propiedad a
--    1500m con radio 5000m daba 0.7 (linear). Con cuadrático da 0.91 —
--    refleja mejor "está en tu zona". Sigue cayendo a 0 en el radio.
--
-- 2) BONUS de neighborhood exacto.
--    Si la propiedad está literalmente en uno de los `desired_neighborhoods`
--    del usuario, spatial = 1.0 fijo (override del cuadrático). Eso da
--    +50% inmediato al score, que es lo que el usuario espera cuando
--    eligió ese barrio específicamente.
--
-- 3) COBERTURA en vez de Jaccard para las amenidades.
--    Jaccard penalizaba propiedades en zonas muy completas con muchos POIs.
--    Cobertura mide solo "qué fracción de lo que pedí está presente" —
--    los extras no penalizan.
--
-- 4) Nuevo HARD FILTER: `min_bedrooms` en profiles.
--    Evita mostrar casas de 4 habitaciones a alguien que busca estudio.
--    NULL = sin filtro (default).
--
-- Sin cambios: filtros duros existentes (budget, property_types) ni la
-- cadena soft de localidad vía target_location.

-- 1. Nueva columna en profiles para filtro por habitaciones mínimas.
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS min_bedrooms integer;

-- 2. Helper: quita acentos y baja a minúsculas (sin requerir extensión unaccent).
CREATE OR REPLACE FUNCTION public.strip_accents_lower(name text) RETURNS text AS $$
  SELECT translate(
    lower(coalesce(name, '')),
    'áéíóúüñàèìòùâêîôû',
    'aeiouunaeiouaeiou'
  )
$$ LANGUAGE sql IMMUTABLE;

-- 3. Función canónica de amenidades.
-- Mapea variantes ("Garaje(s)", "Parking", "Parqueadero Visitantes - Exterior")
-- al mismo concepto canónico ("parqueadero"). Así el matching entre lo que
-- pide el inquilino y lo que el scraper guardó funciona aunque las strings
-- no sean idénticas.
--
-- Si una amenidad no matchea ninguna regla, devuelve la versión normalizada
-- (sin acentos, minúsculas) — eso permite que cualquier amenidad custom del
-- usuario haga match consigo misma sin importar mayúsculas o acentos.
--
-- Para añadir un nuevo concepto: agrega un WHEN nuevo con el patrón regex.
CREATE OR REPLACE FUNCTION public.canonical_amenity(name text) RETURNS text AS $$
DECLARE
  norm text;
BEGIN
  IF name IS NULL OR trim(name) = '' THEN RETURN NULL; END IF;
  norm := public.strip_accents_lower(name);

  RETURN CASE
    -- Interior / edificio
    WHEN norm ~ '(parqueadero|garaje|parking|cochera)' THEN 'parqueadero'
    WHEN norm ~ '(aire.{0,5}acondicionado|\ba\s*/?\s*c\b)' THEN 'aire_acondicionado'
    WHEN norm ~ 'calefaccion' THEN 'calefaccion'
    WHEN norm ~ '(piscina|pool)' THEN 'piscina'
    WHEN norm ~ '(gimnasio|gym|fitness)' THEN 'gimnasio'
    WHEN norm ~ 'amoblado' THEN 'amoblado'
    WHEN norm ~ '(balcon|balcony)' THEN 'balcon'
    WHEN norm ~ 'terraza' THEN 'terraza'
    WHEN norm ~ '(ascensor|elevator)' THEN 'ascensor'
    WHEN norm ~ 'closet' THEN 'closet'
    WHEN norm ~ '(lavanderia|cuarto.{0,5}ropas?|laundry|zona.{0,3}lavado)' THEN 'lavanderia'
    WHEN norm ~ 'cocina.{0,15}(integral|equipada|dotada|americana)' THEN 'cocina_equipada'
    WHEN norm ~ 'estudio' THEN 'estudio'
    WHEN norm ~ 'chimenea' THEN 'chimenea'
    WHEN norm ~ 'calentador' THEN 'calentador'
    WHEN norm ~ '(citofono|intercom|portero)' THEN 'citofono'
    WHEN norm ~ '(salon|sala).{0,3}(comunal|social)' THEN 'salon_comunal'
    WHEN norm ~ 'salon.{0,3}(juegos|eventos)' THEN 'salon_juegos'
    WHEN norm ~ '(asador|bbq|barbac)' THEN 'zona_bbq'
    WHEN norm ~ '(sauna|turco|jacuzzi|spa)' THEN 'spa'
    WHEN norm ~ '(porteria|vigilancia|seguridad|circuito.{0,3}cerrado)' THEN 'seguridad'
    WHEN norm ~ '(zonas?.{0,3}verdes?|jardin)' THEN 'zonas_verdes'
    WHEN norm ~ 'mascotas' THEN 'permite_mascotas'
    WHEN norm ~ '(internet|wifi|wi-?fi)' THEN 'internet'
    WHEN norm ~ '(deposito|bodega|cuarto.{0,3}util)' THEN 'deposito'
    -- Sector (POIs derivados de la propiedad)
    WHEN norm ~ '(transmilenio|trans.{0,4}publico|transporte)' THEN 'transporte_publico'
    WHEN norm ~ '(supermercado|comercio|c\.?\s*comerciales?|abastos)' THEN 'comercio'
    WHEN norm ~ '(universidad|colegio|educacion)' THEN 'educacion'
    WHEN norm ~ 'parque' THEN 'parques'
    WHEN norm ~ '(farmacia|drogueria)' THEN 'farmacias'
    WHEN norm ~ 'restaurante' THEN 'restaurantes'
    WHEN norm ~ '(bar|discoteca|vida.{0,3}nocturna)' THEN 'vida_nocturna'
    WHEN norm ~ 'zona.{0,3}tranquila' THEN 'zona_tranquila'
    -- Fallback: usar la string normalizada para que custom amenities matcheen consigo mismas.
    ELSE norm
  END;
END
$$ LANGUAGE plpgsql IMMUTABLE;

-- 4. Recrear `match_properties` con las nuevas fórmulas, filtro y normalización.
CREATE OR REPLACE FUNCTION public.match_properties(p_user_id uuid)
RETURNS TABLE (
  property_id uuid,
  match_score_percentage integer,
  distance_meters numeric
) AS $$
DECLARE
  v_tenant RECORD;
BEGIN
  SELECT * INTO v_tenant FROM public.profiles WHERE id = p_user_id;
  IF v_tenant IS NULL THEN
    RETURN;
  END IF;

  RETURN QUERY
  WITH property_scores AS (
    SELECT
      p.property_id,
      CASE
        WHEN v_tenant.target_location IS NULL OR p.location IS NULL THEN NULL
        ELSE ST_Distance(p.location, v_tenant.target_location)
      END AS dist_meters,
      (
        -- 50% — Score espacial con BONUS por neighborhood exacto.
        -- Si la propiedad está en uno de los barrios elegidos, spatial = 1.0
        -- de una. Caso contrario, decaimiento cuadrático desde target_location.
        (
          CASE
            -- Bonus: neighborhood en lista del usuario (case-insensitive)
            WHEN p.neighborhood IS NOT NULL
              AND v_tenant.desired_neighborhoods IS NOT NULL
              AND array_length(v_tenant.desired_neighborhoods, 1) IS NOT NULL
              AND lower(p.neighborhood) = ANY(
                SELECT lower(unnest(v_tenant.desired_neighborhoods))
              )
              THEN 1.0
            -- Sin target ni location → neutral
            WHEN v_tenant.target_location IS NULL OR p.location IS NULL THEN 0.5
            -- Decaimiento cuadrático
            ELSE GREATEST(0, 1.0 - POWER(
              ST_Distance(p.location, v_tenant.target_location)
              / GREATEST(1, COALESCE(v_tenant.search_radius_meters, 5000)),
              2
            ))
          END
        ) * 0.50 +

        -- 25% — COBERTURA de amenidades de sector con NORMALIZACIÓN canónica.
        -- "Garaje(s)" del scraper y "Parqueadero" del usuario → mismo concepto.
        -- DISTINCT en el numerador para que múltiples variantes del mismo
        -- concepto no inflen el conteo.
        (
          CASE
            WHEN v_tenant.desired_amenities_sector IS NULL
              OR array_length(v_tenant.desired_amenities_sector, 1) IS NULL THEN 1.0
            ELSE COALESCE(
              (
                SELECT COUNT(DISTINCT public.canonical_amenity(b))::float
                FROM unnest(p.amenities_sector) a, unnest(v_tenant.desired_amenities_sector) b
                WHERE public.canonical_amenity(a) = public.canonical_amenity(b)
              )
              / NULLIF(
                (SELECT COUNT(DISTINCT public.canonical_amenity(b))::float
                 FROM unnest(v_tenant.desired_amenities_sector) b),
                0
              )
            , 0.0)
          END
        ) * 0.25 +

        -- 25% — COBERTURA del apto, comparando contra interior + exterior
        -- COMBINADOS del lado de la propiedad. Razón: el tenant pide cosas
        -- como "Parqueadero", "Gimnasio", "Ascensor" sin distinguir si son
        -- dentro del apto o áreas comunes del edificio — para él es la misma
        -- categoría ("¿la propiedad lo tiene?"). El owner sí los separa, pero
        -- esa separación es para organización de la publicación, no debería
        -- afectar el matching.
        (
          CASE
            WHEN v_tenant.desired_amenities_interior IS NULL
              OR array_length(v_tenant.desired_amenities_interior, 1) IS NULL THEN 1.0
            ELSE COALESCE(
              (
                SELECT COUNT(DISTINCT public.canonical_amenity(b))::float
                FROM unnest(COALESCE(p.amenities_interior, '{}'::text[]) || COALESCE(p.amenities_exterior, '{}'::text[])) a,
                     unnest(v_tenant.desired_amenities_interior) b
                WHERE public.canonical_amenity(a) = public.canonical_amenity(b)
              )
              / NULLIF(
                (SELECT COUNT(DISTINCT public.canonical_amenity(b))::float
                 FROM unnest(v_tenant.desired_amenities_interior) b),
                0
              )
            , 0.0)
          END
        ) * 0.25
      ) AS match_score
    FROM public.properties p
    WHERE
      -- HARD: presupuesto.
      p.monthly_rent BETWEEN COALESCE(v_tenant.min_budget, 0)
                         AND COALESCE(v_tenant.max_budget, 999999999)
      -- HARD: tipo de propiedad.
      AND (
        v_tenant.desired_property_types IS NULL
        OR array_length(v_tenant.desired_property_types, 1) IS NULL
        OR p.property_type = ANY(v_tenant.desired_property_types)
      )
      -- HARD: habitaciones mínimas (NULL = sin filtro).
      AND (
        v_tenant.min_bedrooms IS NULL
        OR p.bedrooms IS NULL
        OR p.bedrooms >= v_tenant.min_bedrooms
      )
  )
  SELECT
    ps.property_id,
    ROUND(ps.match_score * 100)::int AS match_score_percentage,
    ps.dist_meters::numeric AS distance_meters
  FROM property_scores ps
  ORDER BY match_score_percentage DESC, ps.dist_meters ASC NULLS LAST
  LIMIT 50;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
