-- Story 4-6: Add 'uploaded' intermediate status to submissions
-- Flow: uploading → uploaded → submitted
-- 'uploaded' means file is stored but participant hasn't confirmed yet

-- Drop existing constraint and recreate with new status
ALTER TABLE public.submissions
  DROP CONSTRAINT IF EXISTS submissions_status_check;

ALTER TABLE public.submissions
  ADD CONSTRAINT submissions_status_check
  CHECK (status IN ('uploading', 'uploaded', 'submitted', 'disqualified'));
