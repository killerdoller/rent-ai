-- Migration: add_profile_details
-- Description: Adds missing columns for the new profile design based on Figma.

ALTER TABLE public.profiles
    ADD COLUMN IF NOT EXISTS bio text,
    ADD COLUMN IF NOT EXISTS job_title text,
    ADD COLUMN IF NOT EXISTS interests text[] DEFAULT '{}',
    ADD COLUMN IF NOT EXISTS lifestyle_tags text[] DEFAULT '{}',
    ADD COLUMN IF NOT EXISTS cleanliness_level integer DEFAULT 5,
    ADD COLUMN IF NOT EXISTS social_level integer DEFAULT 5,
    ADD COLUMN IF NOT EXISTS profile_images text[] DEFAULT '{}';

-- Optional: Comments for documentation
COMMENT ON COLUMN public.profiles.cleanliness_level IS 'Rank from 1 to 10';
COMMENT ON COLUMN public.profiles.social_level IS 'Rank from 1 to 10';
