-- Tabla para almacenar los resultados del motor de recomendación de Hugging Face
CREATE TABLE IF NOT EXISTS public.recommendations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    recommended_user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    match_score FLOAT8 NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now(),
    
    -- Evitar duplicados de la misma recomendación
    UNIQUE(user_id, recommended_user_id)
);

-- Índice para búsquedas rápidas por usuario
CREATE INDEX IF NOT EXISTS idx_recommendations_user_id ON public.recommendations(user_id);

-- Habilitar RLS (Seguridad)
ALTER TABLE public.recommendations ENABLE ROW LEVEL SECURITY;

-- Política: Los usuarios pueden leer sus propias recomendaciones
CREATE POLICY "Users can view their own recommendations" 
ON public.recommendations FOR SELECT 
USING (auth.uid() = user_id);

-- Política: El motor (Service Role) puede hacer todo
CREATE POLICY "Service role full access" 
ON public.recommendations FOR ALL 
USING (true) 
WITH CHECK (true);
