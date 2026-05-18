-- Migración para habilitar la automatización de recomendaciones vía Webhook
-- Esta migración conecta Supabase con el motor de IA en Hugging Face

-- 1. Habilitar la extensión para peticiones HTTP asíncronas
CREATE EXTENSION IF NOT EXISTS pg_net;

-- 2. Función para notificar al motor de IA
CREATE OR REPLACE FUNCTION public.notify_ai_engine_on_profile_change()
RETURNS TRIGGER AS $$
DECLARE
  payload JSONB;
  request_id BIGINT;
BEGIN
  -- Construir el payload con la información necesaria
  -- Enviamos el user_id para que el motor sepa a quién procesar
  payload := jsonb_build_object(
    'user_id', NEW.id,
    'event_type', TG_OP,
    'timestamp', now()
  );

  -- Realizar la petición HTTP asíncrona a Hugging Face
  -- Usamos pg_net para no bloquear la transacción del usuario
  SELECT net.http_post(
    url := 'https://nassirgabba-rent-ai-engine.hf.space/sync',
    body := payload::text,
    headers := '{"Content-Type": "application/json"}'
  ) INTO request_id;

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
