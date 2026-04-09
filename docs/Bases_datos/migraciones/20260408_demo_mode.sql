-- ============================================================
-- Migration: demo_mode
-- Relax FK constraints and RLS so the app works without auth.
-- Replace with auth-based policies when login is implemented.
-- ============================================================

-- 1. Drop FK constraints that require auth.users-linked profiles
ALTER TABLE public.property_likes
    DROP CONSTRAINT IF EXISTS property_likes_user_id_fkey;

ALTER TABLE public.property_rejections
    DROP CONSTRAINT IF EXISTS property_rejections_user_id_fkey;

ALTER TABLE public.owner_tenant_likes
    DROP CONSTRAINT IF EXISTS owner_tenant_likes_user_id_fkey;

ALTER TABLE public.property_matches
    DROP CONSTRAINT IF EXISTS property_matches_user_id_fkey;

-- 2. Relax RLS: allow all operations for demo mode

-- property_likes
DROP POLICY IF EXISTS "property_likes_select_own" ON public.property_likes;
DROP POLICY IF EXISTS "property_likes_insert_own" ON public.property_likes;
DROP POLICY IF EXISTS "property_likes_delete_own" ON public.property_likes;
CREATE POLICY "property_likes_select_demo" ON public.property_likes FOR SELECT USING (true);
CREATE POLICY "property_likes_insert_demo" ON public.property_likes FOR INSERT WITH CHECK (true);
CREATE POLICY "property_likes_delete_demo" ON public.property_likes FOR DELETE USING (true);

-- property_rejections
DROP POLICY IF EXISTS "property_rejections_select_own" ON public.property_rejections;
DROP POLICY IF EXISTS "property_rejections_insert_own" ON public.property_rejections;
CREATE POLICY "property_rejections_select_demo" ON public.property_rejections FOR SELECT USING (true);
CREATE POLICY "property_rejections_insert_demo" ON public.property_rejections FOR INSERT WITH CHECK (true);

-- owner_tenant_likes
DROP POLICY IF EXISTS "owner_tenant_likes_select" ON public.owner_tenant_likes;
DROP POLICY IF EXISTS "owner_tenant_likes_insert" ON public.owner_tenant_likes;
CREATE POLICY "owner_tenant_likes_select_demo" ON public.owner_tenant_likes FOR SELECT USING (true);
CREATE POLICY "owner_tenant_likes_insert_demo" ON public.owner_tenant_likes FOR INSERT WITH CHECK (true);

-- property_matches
DROP POLICY IF EXISTS "property_matches_select_own" ON public.property_matches;
CREATE POLICY "property_matches_select_demo" ON public.property_matches FOR SELECT USING (true);
