-- Migration: Add v2 stepper fields to consultation_requests
-- All columns are nullable — no breaking changes

ALTER TABLE consultation_requests
  ADD COLUMN IF NOT EXISTS region text,
  ADD COLUMN IF NOT EXISTS team_size text,
  ADD COLUMN IF NOT EXISTS topics jsonb DEFAULT '[]',
  ADD COLUMN IF NOT EXISTS situation text,
  ADD COLUMN IF NOT EXISTS notes text;
