-- ============================================================
-- Migration: 20260515_secure_all_tables
-- Purpose: Remove demo mode, enforce RLS strictly, and require 
-- authentication for all reads on properties and owners.
-- ============================================================

-- 1. Drop the guest_users table since demo mode is no longer needed
DROP TABLE IF EXISTS public.guest_users CASCADE;

-- 2. Dynamically enable RLS on all tables in the public schema
DO $$ 
DECLARE 
    t record;
BEGIN 
    FOR t IN 
        SELECT tablename 
        FROM pg_tables 
        WHERE schemaname = 'public' 
    LOOP
        EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY;', t.tablename);
    END LOOP; 
END $$;

-- 3. Restrict properties and owners to authenticated users only
-- First drop the public read policies
DROP POLICY IF EXISTS "properties_select" ON public.properties;
DROP POLICY IF EXISTS "owners_select" ON public.owners;

-- Recreate them requiring auth.uid()
CREATE POLICY "properties_select" ON public.properties 
    FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "owners_select" ON public.owners 
    FOR SELECT USING (auth.uid() IS NOT NULL);

-- Note: All other tables were already configured to use auth.uid() 
-- in migration 20260503_enable_rls.sql. This ensures there are absolutely 
-- no public tables remaining.
