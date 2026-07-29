ALTER TABLE trends ADD COLUMN IF NOT EXISTS previous_session_count integer DEFAULT 0;
