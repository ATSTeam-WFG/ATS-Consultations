CREATE TABLE IF NOT EXISTS intake_questions (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  key           TEXT UNIQUE NOT NULL,
  type          TEXT NOT NULL CHECK (type IN ('choice', 'multiselect', 'text', 'contact')),
  title         TEXT NOT NULL,
  subtitle      TEXT,
  options       JSONB,
  max_select    INTEGER,
  display_order INTEGER NOT NULL DEFAULT 0,
  enabled       BOOLEAN NOT NULL DEFAULT true,
  created_at    TIMESTAMPTZ DEFAULT now(),
  updated_at    TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE intake_questions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Team can manage intake questions" ON intake_questions
  FOR ALL USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');
