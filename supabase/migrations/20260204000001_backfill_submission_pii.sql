-- Backfill PII from participants table to submissions table for existing records.
-- New submissions collect PII directly on the upload form; this migrates legacy data.

UPDATE public.submissions s
SET
  student_name = p.name,
  tlc_name = p.tlc_name,
  tlc_email = p.tlc_email
FROM public.participants p
WHERE s.participant_id = p.id
  AND s.student_name IS NULL;
