-- Migration: drop_profiles_auth_fk
-- Description: Drops the foreign key constraint on profiles.id that references auth.users(id).
-- This allows Clerk users (who don't exist in auth.users) to have profiles.

ALTER TABLE public.profiles
    DROP CONSTRAINT IF EXISTS profiles_id_fkey;

-- Also ensure RLS doesn't block the service role (it shouldn't, but let's be safe)
-- The profiles_insert_own policy might fail for Clerk users if it uses auth.uid()
-- But since we use the service role key in the sync API, it bypasses RLS.
