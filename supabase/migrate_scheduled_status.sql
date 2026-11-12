-- Migration: add 'scheduled' to sessions status check constraint
-- Required for Feature 4 (Calendar) — scheduled meetings before transcript is logged

ALTER TABLE sessions DROP CONSTRAINT sessions_status_check;
ALTER TABLE sessions ADD CONSTRAINT sessions_status_check
  CHECK (status IN ('scheduled', 'pending', 'processing', 'processed', 'failed'));
