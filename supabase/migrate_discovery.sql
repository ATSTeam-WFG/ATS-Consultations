-- Discovery Bot migration: adds 5 new nullable columns to consultation_requests
ALTER TABLE consultation_requests
  ADD COLUMN IF NOT EXISTS chat_transcript jsonb DEFAULT '[]',
  ADD COLUMN IF NOT EXISTS submitter_email text,
  ADD COLUMN IF NOT EXISTS request_source text DEFAULT 'stepper',
  ADD COLUMN IF NOT EXISTS closing_software text,
  ADD COLUMN IF NOT EXISTS request_type text;

-- request_source values: 'stepper' | 'chatbot'
-- request_type values: 'consultation' | 'product_setup' | 'tool_inquiry' | 'idea_pitch' | 'efficiency_help'
