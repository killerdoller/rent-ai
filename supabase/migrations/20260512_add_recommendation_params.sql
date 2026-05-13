-- Migración: Añadir parámetros para el algoritmo de recomendación híbrido
-- Fecha: 2026-05-12

-- 1. Añadir rangos de presupuesto (Usamos NUMERIC por seguridad y precisión)
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS min_budget NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS max_budget NUMERIC DEFAULT 5000000;

-- Migración inicial de datos con seguridad
UPDATE profiles 
SET min_budget = GREATEST(0, monthly_budget - 250000), 
    max_budget = monthly_budget + 250000 
WHERE monthly_budget IS NOT NULL 
  AND monthly_budget < 1000000000  -- Solo procesar si es menor a mil millones (seguridad)
  AND (min_budget = 0 OR min_budget IS NULL);

-- 2. Añadir Reglas de Exclusión (Dealbreakers)
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS exclusion_rules JSONB DEFAULT '{"no_smokers": false, "pets_accepted": false, "same_gender": false}'::jsonb;

-- 3. Añadir Pesos de Importancia Dinámicos
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS importance_weights JSONB DEFAULT '{"budget": 1.0, "lifestyle": 1.0, "interests": 1.0, "personality": 1.0}'::jsonb;

-- 4. Documentación
COMMENT ON COLUMN profiles.min_budget IS 'Presupuesto mínimo que el usuario está dispuesto a pagar';
COMMENT ON COLUMN profiles.max_budget IS 'Presupuesto máximo que el usuario está dispuesto a pagar';
COMMENT ON COLUMN profiles.exclusion_rules IS 'Reglas binarias de exclusión para el algoritmo de matching';
COMMENT ON COLUMN profiles.importance_weights IS 'Pesos dinámicos configurados por el usuario';
