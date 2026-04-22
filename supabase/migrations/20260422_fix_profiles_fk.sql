-- Migration: fix_profiles_fk
-- Description: Drops the FK constraint on profiles.id that references auth.users.
-- Since we are using Clerk for auth, we don't need this constraint.

ALTER TABLE public.profiles
    DROP CONSTRAINT IF EXISTS profiles_id_fkey;

-- Also check if owners has a similar FK (it shouldn't based on init_schema but good to be sure)
ALTER TABLE public.owners
    DROP CONSTRAINT IF EXISTS owners_clerk_id_fkey;
