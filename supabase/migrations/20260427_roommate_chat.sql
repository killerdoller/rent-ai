-- Add roommate_match_id to conversations so roommate matches can have a chat
ALTER TABLE public.conversations
  ADD COLUMN IF NOT EXISTS roommate_match_id uuid REFERENCES public.roommate_matches(match_id) ON DELETE CASCADE;

-- Replace the full-column unique constraint with partial indexes so both columns can coexist
ALTER TABLE public.conversations DROP CONSTRAINT IF EXISTS conversations_property_match_id_key;
CREATE UNIQUE INDEX IF NOT EXISTS conversations_property_match_id_uidx ON public.conversations(property_match_id) WHERE property_match_id IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS conversations_roommate_match_id_uidx ON public.conversations(roommate_match_id) WHERE roommate_match_id IS NOT NULL;
