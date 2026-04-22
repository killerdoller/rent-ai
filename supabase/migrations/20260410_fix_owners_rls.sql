-- Migration: fix_owners_rls
-- La tabla owners solo tenía política SELECT.
-- Sin política INSERT, el API route fallaba silenciosamente al registrar propietarios
-- cuando SUPABASE_SERVICE_ROLE_KEY no estaba disponible.

-- Permitir inserción pública (el API route valida la lógica; RLS solo bloquea acceso directo)
CREATE POLICY "owners_insert_public"
    ON public.owners FOR INSERT
    WITH CHECK (true);

-- Permitir que un owner actualice su propio registro (por si acaso)
CREATE POLICY "owners_update_own"
    ON public.owners FOR UPDATE
    USING (auth.uid() = owner_id);
