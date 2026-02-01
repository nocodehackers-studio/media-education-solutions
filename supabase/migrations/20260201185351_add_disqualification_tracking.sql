-- Story 6-4: Add disqualification tracking columns to submissions table
-- Note: 'disqualified' is already a valid status value in the CHECK constraint
-- (added in migration 20260129194757_add_uploaded_status_to_submissions.sql)

ALTER TABLE public.submissions
ADD COLUMN IF NOT EXISTS disqualified_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS restored_at TIMESTAMPTZ;
