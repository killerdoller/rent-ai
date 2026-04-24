-- Add profile_completed flag to detect users who finished onboarding
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS profile_completed boolean DEFAULT false;

-- Mark existing profiles that have meaningful data as already completed
UPDATE public.profiles
SET profile_completed = true
WHERE bio IS NOT NULL
   OR (interests IS NOT NULL AND array_length(interests, 1) > 0)
   OR (lifestyle_tags IS NOT NULL AND array_length(lifestyle_tags, 1) > 0)
   OR (profile_images IS NOT NULL AND array_length(profile_images, 1) > 0);
