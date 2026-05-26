-- Migration: match_properties_soft_locality
--
-- Contexto: la función `match_properties` deployada en producción difería del
-- archivo de migración 20260521124312_spatial_property_match.sql — alguien le
-- añadió tres filtros DUROS en la cláusula WHERE (monthly_budget,
-- desired_property_types, desired_localities) que no estaban documentados.
--
-- El filtro `p.localidad = ANY(v_tenant.desired_localities)` excluía TODAS
-- las propiedades del scraper porque éste guardaba NULL en `localidad`. El
-- scraper ya quedó arreglado en webscrapper/scraper_to_supabase.py para
-- poblar `localidad` con el nombre canónico de la localidad de Bogotá.
--
-- Esta migración recrea la función con un diseño consistente:
--   • Localidad como SOFT ranking (no excluye, el centroide geocodificado
--     en `target_location` ya hace que las propiedades en la localidad
--     deseada queden arriba del ranking por el peso espacial del 50%).
--   • Tipo de propiedad sigue como HARD filter (si el usuario pide Apto,
--     Casa o Habitación, no tiene sentido mostrarle los otros tipos).
--   • Presupuesto usa `min_budget`/`max_budget` (lo que llena el formulario)
--     en vez de `monthly_budget` (campo legacy que el form ya no escribe).

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
        -- 50% — Decaimiento espacial. target_location se calcula geocodificando
        -- las zonas deseadas (desired_neighborhoods o desired_localities) en
        -- CompleteProfile.tsx, así que la preferencia por localidad ya entra
        -- aquí de forma natural: una propiedad en Chapinero está cerca del
        -- centroide de Chapinero y obtiene score alto.
        (
          CASE
            WHEN v_tenant.target_location IS NULL OR p.location IS NULL THEN 0.5
            ELSE GREATEST(0, 1.0 - (
              ST_Distance(p.location, v_tenant.target_location)
              / GREATEST(1, COALESCE(v_tenant.search_radius_meters, 5000))
            ))
          END
        ) * 0.50 +

        -- 25% — Jaccard de amenidades de sector (POIs reales de OSM).
        (
          CASE
            WHEN v_tenant.desired_amenities_sector IS NULL
              OR array_length(v_tenant.desired_amenities_sector, 1) IS NULL THEN 1.0
            ELSE COALESCE(
              (SELECT COUNT(*)::float
                 FROM unnest(p.amenities_sector) a
                 JOIN unnest(v_tenant.desired_amenities_sector) b ON a = b)
              / NULLIF((SELECT COUNT(*)::float
                          FROM (SELECT unnest(p.amenities_sector)
                                UNION SELECT unnest(v_tenant.desired_amenities_sector)) u), 0)
            , 0.0)
          END
        ) * 0.25 +

        -- 25% — Jaccard de amenidades interiores.
        (
          CASE
            WHEN v_tenant.desired_amenities_interior IS NULL
              OR array_length(v_tenant.desired_amenities_interior, 1) IS NULL THEN 1.0
            ELSE COALESCE(
              (SELECT COUNT(*)::float
                 FROM unnest(p.amenities_interior) a
                 JOIN unnest(v_tenant.desired_amenities_interior) b ON a = b)
              / NULLIF((SELECT COUNT(*)::float
                          FROM (SELECT unnest(p.amenities_interior)
                                UNION SELECT unnest(v_tenant.desired_amenities_interior)) u), 0)
            , 0.0)
          END
        ) * 0.25
      ) AS match_score
    FROM public.properties p
    WHERE
      -- HARD FILTER: presupuesto. Usa min/max_budget (lo que llena CompleteProfile),
      -- no el legacy monthly_budget.
      p.monthly_rent BETWEEN COALESCE(v_tenant.min_budget, 0)
                         AND COALESCE(v_tenant.max_budget, 999999999)

      -- HARD FILTER: tipo de propiedad. Si el usuario filtra por tipos, los
      -- otros se excluyen — es discreto (Apto/Casa/Habitación), no admite
      -- gradación como el espacial.
      AND (
        v_tenant.desired_property_types IS NULL
        OR array_length(v_tenant.desired_property_types, 1) IS NULL
        OR p.property_type = ANY(v_tenant.desired_property_types)
      )

      -- NOTA: desired_localities NO se filtra aquí. La preferencia por
      -- localidades se respeta vía target_location (ranking suave), de modo
      -- que las propiedades cercanas a la zona deseada salen primero pero
      -- las cercanas en localidades vecinas siguen siendo descubribles.
      -- Si en el futuro se quiere un filtro estricto, añadirlo como toggle
      -- en la UI (pestaña Descubrir) y pasarlo como parámetro a esta RPC.
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
