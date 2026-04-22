-- ============================================================
-- Migration: security_reinforcement
-- Re-enables RLS and sets strict policies to prevent unauthorized access.
-- ============================================================

-- 1. Enable RLS on all key tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.owners ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.property_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.property_rejections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.owner_tenant_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.property_matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;

-- 2. Define Strict Policies
-- These policies block public access via Anon Key, 
-- but allow Service Role (API routes) to continue working as usual.

-- Profiles: Public can read (for discovery), but NO ONE can write via Anon Key.
DROP POLICY IF EXISTS "profiles_select_demo" ON public.profiles;
CREATE POLICY "profiles_read_all" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "profiles_no_anon_write" ON public.profiles FOR ALL USING (false) WITH CHECK (false);

-- Properties: Public can read, but NO ONE can write via Anon Key.
DROP POLICY IF EXISTS "properties_select_all" ON public.properties;
CREATE POLICY "properties_read_all" ON public.properties FOR SELECT USING (true);
CREATE POLICY "properties_no_anon_write" ON public.properties FOR ALL USING (false) WITH CHECK (false);

-- Owners: Public can read, no writing.
DROP POLICY IF EXISTS "owners_select_all" ON public.owners;
CREATE POLICY "owners_read_all" ON public.owners FOR SELECT USING (true);

-- Likes/Rejections/Matches: TOTAL BLOCK for Anon Key.
-- Only the Service Role (Backend) can see/touch these.
DROP POLICY IF EXISTS "property_likes_select_demo" ON public.property_likes;
DROP POLICY IF EXISTS "property_likes_insert_demo" ON public.property_likes;
DROP POLICY IF EXISTS "property_likes_delete_demo" ON public.property_likes;
CREATE POLICY "property_likes_locked" ON public.property_likes FOR ALL USING (false) WITH CHECK (false);

DROP POLICY IF EXISTS "property_rejections_select_demo" ON public.property_rejections;
DROP POLICY IF EXISTS "property_rejections_insert_demo" ON public.property_rejections;
CREATE POLICY "property_rejections_locked" ON public.property_rejections FOR ALL USING (false) WITH CHECK (false);

DROP POLICY IF EXISTS "owner_tenant_likes_select_demo" ON public.owner_tenant_likes;
DROP POLICY IF EXISTS "owner_tenant_likes_insert_demo" ON public.owner_tenant_likes;
CREATE POLICY "owner_tenant_likes_locked" ON public.owner_tenant_likes FOR ALL USING (false) WITH CHECK (false);

DROP POLICY IF EXISTS "property_matches_select_demo" ON public.property_matches;
CREATE POLICY "property_matches_locked" ON public.property_matches FOR ALL USING (false) WITH CHECK (false);

-- Chat: Locked for Anon Key.
CREATE POLICY "messages_locked" ON public.messages FOR ALL USING (false) WITH CHECK (false);
CREATE POLICY "conversations_locked" ON public.conversations FOR ALL USING (false) WITH CHECK (false);

-- Note: The Backend uses Service Role Key, which bypasses all the policies above.
-- This ensures the app keeps working while the database is "invisible" to hackers.
