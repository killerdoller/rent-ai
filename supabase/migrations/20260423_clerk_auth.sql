-- Add Clerk user ID columns for auth migration
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS clerk_id text;
CREATE UNIQUE INDEX IF NOT EXISTS profiles_clerk_id_key ON public.profiles(clerk_id) WHERE clerk_id IS NOT NULL;

ALTER TABLE public.owners ADD COLUMN IF NOT EXISTS clerk_id text;
CREATE UNIQUE INDEX IF NOT EXISTS owners_clerk_id_key ON public.owners(clerk_id) WHERE clerk_id IS NOT NULL;
