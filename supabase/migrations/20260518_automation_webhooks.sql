-- Migración para habilitar la automatización de recomendaciones vía Webhook
-- Esta migración conecta Supabase con el motor de IA en Hugging Face

-- 1. Habilitar la extensión para peticiones HTTP asíncronas
CREATE EXTENSION IF NOT EXISTS pg_net;

-- 2. Función para notificar al motor de IA (VERSIÓN RESILIENTE)
CREATE OR REPLACE FUNCTION public.notify_ai_engine_on_profile_change()
RETURNS TRIGGER AS $$
DECLARE
  payload JSONB;
  request_id BIGINT;
BEGIN
  -- 1. Construir el payload
  payload := jsonb_build_object(
    'user_id', NEW.id,
    'event_type', TG_OP,
    'timestamp', now()
  );

  -- 2. Intentar la llamada HTTP de forma segura
  -- El bloque BEGIN...EXCEPTION evita que un fallo de red o de la extensión aborte el registro
  BEGIN
    -- Verificar si pg_net está disponible en el esquema esperado
    IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_net') THEN
      SELECT net.http_post(
        url := 'https://nassirgabba-rent-ai-engine.hf.space/sync',
        body := payload::text,
        headers := '{"Content-Type": "application/json"}'
      ) INTO request_id;
    END IF;
  EXCEPTION WHEN OTHERS THEN
    -- Silenciamos el error para no bloquear la transacción principal
    -- Podrías loguear el error en una tabla de logs si fuera necesario
    RAISE WARNING 'Fallo en la notificación al motor de IA: %', SQLERRM;
  END;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Trigger para nuevos usuarios
-- Se dispara después de que un perfil es insertado
DROP TRIGGER IF EXISTS tr_notify_ai_on_insert ON public.profiles;
CREATE TRIGGER tr_notify_ai_on_insert
  AFTER INSERT ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_ai_engine_on_profile_change();

-- 4. Trigger para actualizaciones críticas
-- Opcional: Se dispara si el usuario cambia su presupuesto o tags de lifestyle
DROP TRIGGER IF EXISTS tr_notify_ai_on_update ON public.profiles;
CREATE TRIGGER tr_notify_ai_on_update
  AFTER UPDATE OF monthly_budget, lifestyle_tags, cleanliness_level, social_level ON public.profiles
  FOR EACH ROW
  WHEN (OLD.* IS DISTINCT FROM NEW.*)
  EXECUTE FUNCTION public.notify_ai_engine_on_profile_change();

COMMENT ON FUNCTION public.notify_ai_engine_on_profile_change IS 'Notifica al motor de IA en Hugging Face para recalcular recomendaciones';
