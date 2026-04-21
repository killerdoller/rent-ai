-- Chat system: conversations and messages tables

CREATE TABLE IF NOT EXISTS conversations (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  property_match_id uuid UNIQUE,
  created_at        timestamptz DEFAULT now(),
  last_message_at   timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS messages (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  sender_id       text NOT NULL,
  sender_type     text NOT NULL CHECK (sender_type IN ('user', 'owner')),
  content         text NOT NULL,
  created_at      timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_messages_conv_time ON messages(conversation_id, created_at);

ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages     ENABLE ROW LEVEL SECURITY;

CREATE POLICY "open_conversations" ON conversations FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "open_messages"      ON messages      FOR ALL USING (true) WITH CHECK (true);
