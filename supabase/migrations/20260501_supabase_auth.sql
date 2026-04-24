-- Migration: supabase_auth
-- Replace Clerk auth with Supabase Auth natively.
-- profiles.id = auth.users.id (trigger already handles this).
-- owners get an auth_user_id column for linking to auth.users.

-- Link owners to Supabase Auth users
ALTER TABLE public.owners
  ADD COLUMN IF NOT EXISTS auth_user_id uuid REFERENCES auth.users(id);
CREATE UNIQUE INDEX IF NOT EXISTS owners_auth_user_id_key
  ON public.owners(auth_user_id) WHERE auth_user_id IS NOT NULL;

-- Remove Clerk bridge columns
ALTER TABLE public.profiles DROP COLUMN IF EXISTS clerk_id;
ALTER TABLE public.owners   DROP COLUMN IF EXISTS clerk_id;

-- Update trigger to also copy last_name and avatar_url from OAuth metadata
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, first_name, last_name, avatar_url)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'first_name', split_part(COALESCE(NEW.raw_user_meta_data->>'full_name', ''), ' ', 1), ''),
    COALESCE(NEW.raw_user_meta_data->>'last_name',  split_part(COALESCE(NEW.raw_user_meta_data->>'full_name', ''), ' ', 2), ''),
    COALESCE(NEW.raw_user_meta_data->>'avatar_url', NEW.raw_user_meta_data->>'picture', '')
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
