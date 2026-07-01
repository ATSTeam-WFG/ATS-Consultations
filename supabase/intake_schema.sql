-- Intake tokens: one per agent per send, validated server-side
CREATE TABLE intake_tokens (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  token        TEXT UNIQUE NOT NULL DEFAULT encode(gen_random_bytes(32), 'hex'),
  agent_id     UUID REFERENCES agents(id) ON DELETE CASCADE NOT NULL,
  created_by   UUID REFERENCES auth.users(id) NOT NULL,
  submitted_at TIMESTAMPTZ,
  created_at   TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX idx_intake_tokens_token ON intake_tokens(token);
CREATE INDEX idx_intake_tokens_agent ON intake_tokens(agent_id);

-- Agent intake responses
CREATE TABLE agent_intakes (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  token_id     UUID REFERENCES intake_tokens(id) ON DELETE CASCADE NOT NULL,
  agent_id     UUID REFERENCES agents(id) ON DELETE CASCADE NOT NULL,
  responses    JSONB NOT NULL DEFAULT '{}',
  submitted_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX idx_agent_intakes_agent ON agent_intakes(agent_id);

-- RLS: only authenticated team users can see these tables
-- Public access goes through service role API routes only
ALTER TABLE intake_tokens ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Team can manage intake tokens" ON intake_tokens
  FOR ALL USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');

ALTER TABLE agent_intakes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Team can view agent intakes" ON agent_intakes
  FOR ALL USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');
