-- Drop all existing policies (replaces the USING (true) demo policies)
DO $$
DECLARE pol record;
BEGIN
  FOR pol IN SELECT schemaname, tablename, policyname FROM pg_policies WHERE schemaname = 'public' LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON %I.%I', pol.policyname, pol.schemaname, pol.tablename);
  END LOOP;
END $$;

-- Enable RLS on all tables
ALTER TABLE profiles             ENABLE ROW LEVEL SECURITY;
ALTER TABLE properties           ENABLE ROW LEVEL SECURITY;
ALTER TABLE owners               ENABLE ROW LEVEL SECURITY;
ALTER TABLE property_likes       ENABLE ROW LEVEL SECURITY;
ALTER TABLE property_rejections  ENABLE ROW LEVEL SECURITY;
ALTER TABLE property_matches     ENABLE ROW LEVEL SECURITY;
ALTER TABLE owner_tenant_likes   ENABLE ROW LEVEL SECURITY;
ALTER TABLE roommate_likes       ENABLE ROW LEVEL SECURITY;
ALTER TABLE roommate_rejections  ENABLE ROW LEVEL SECURITY;
ALTER TABLE roommate_matches     ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations        ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages             ENABLE ROW LEVEL SECURITY;

-- ── profiles ──────────────────────────────────────────────────────────────────
-- Authenticated users can read all profiles (needed for discovery / roommate cards)
CREATE POLICY "profiles_select"        ON profiles FOR SELECT USING (auth.uid() IS NOT NULL);
-- Users can only modify their own profile
CREATE POLICY "profiles_update_own"    ON profiles FOR UPDATE USING (auth.uid() = id);
-- Trigger on_auth_user_created inserts via service role, no client INSERT needed

-- ── properties ────────────────────────────────────────────────────────────────
-- Public read — listings are public, no login needed to browse
CREATE POLICY "properties_select"      ON properties FOR SELECT USING (true);

-- ── owners ────────────────────────────────────────────────────────────────────
-- Public read — owner name shown in match popup
CREATE POLICY "owners_select"          ON owners FOR SELECT USING (true);

-- ── property_likes ────────────────────────────────────────────────────────────
CREATE POLICY "prop_likes_select"      ON property_likes FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "prop_likes_insert"      ON property_likes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "prop_likes_delete"      ON property_likes FOR DELETE USING (auth.uid() = user_id);

-- ── property_rejections ───────────────────────────────────────────────────────
CREATE POLICY "prop_rej_select"        ON property_rejections FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "prop_rej_insert"        ON property_rejections FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "prop_rej_delete"        ON property_rejections FOR DELETE USING (auth.uid() = user_id);

-- ── property_matches ──────────────────────────────────────────────────────────
-- Trigger-created only (service role), tenants just read their own
CREATE POLICY "prop_matches_select"    ON property_matches FOR SELECT USING (auth.uid() = user_id);

-- ── owner_tenant_likes ────────────────────────────────────────────────────────
-- Only accessed via API routes (service role) — no client policies needed

-- ── roommate_likes ────────────────────────────────────────────────────────────
-- Users see likes they gave OR received (needed for Realtime notifications)
CREATE POLICY "rm_likes_select"        ON roommate_likes FOR SELECT USING (auth.uid() = user_id OR auth.uid() = liked_user_id);
CREATE POLICY "rm_likes_insert"        ON roommate_likes FOR INSERT WITH CHECK (auth.uid() = user_id);

-- ── roommate_rejections ───────────────────────────────────────────────────────
CREATE POLICY "rm_rej_select"          ON roommate_rejections FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "rm_rej_insert"          ON roommate_rejections FOR INSERT WITH CHECK (auth.uid() = user_id);

-- ── roommate_matches ──────────────────────────────────────────────────────────
-- Trigger-created only (service role), users read matches they're part of
CREATE POLICY "rm_matches_select"      ON roommate_matches FOR SELECT USING (auth.uid() = student_1_id OR auth.uid() = student_2_id);

-- ── conversations ─────────────────────────────────────────────────────────────
-- Authenticated users can read conversations they're part of (needed for Realtime chat list)
CREATE POLICY "conversations_select" ON conversations FOR SELECT USING (
  auth.uid() IS NOT NULL AND (
    EXISTS (
      SELECT 1 FROM property_matches
      WHERE property_matches.id = conversations.property_match_id
        AND property_matches.user_id = auth.uid()
    ) OR EXISTS (
      SELECT 1 FROM roommate_matches
      WHERE roommate_matches.match_id = conversations.roommate_match_id
        AND (roommate_matches.student_1_id = auth.uid() OR roommate_matches.student_2_id = auth.uid())
    )
  )
);

-- ── messages ──────────────────────────────────────────────────────────────────
-- Users can read messages from their own conversations (needed for Realtime chat)
CREATE POLICY "messages_select" ON messages FOR SELECT USING (
  auth.uid() IS NOT NULL AND
  EXISTS (
    SELECT 1 FROM conversations c
    LEFT JOIN property_matches pm  ON pm.id        = c.property_match_id
    LEFT JOIN roommate_matches rm  ON rm.match_id  = c.roommate_match_id
    WHERE c.id = messages.conversation_id
      AND (
        pm.user_id          = auth.uid() OR
        rm.student_1_id     = auth.uid() OR
        rm.student_2_id     = auth.uid()
      )
  )
);
