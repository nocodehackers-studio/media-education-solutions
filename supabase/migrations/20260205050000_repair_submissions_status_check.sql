-- Repair: submissions_status_check constraint is missing 'uploaded' status.
-- Migration 20260129194757 was recorded but the constraint was never updated.
-- The 'uploaded' status is required for the upload-photo → confirm-submission flow.

ALTER TABLE public.submissions DROP CONSTRAINT IF EXISTS submissions_status_check;
ALTER TABLE public.submissions ADD CONSTRAINT submissions_status_check
  CHECK (status IN ('uploading', 'uploaded', 'submitted', 'disqualified'));
