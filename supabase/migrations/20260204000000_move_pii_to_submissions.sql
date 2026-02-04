-- Move participant PII from participants table to submissions table.
-- Codes now represent institutions, not individuals.
-- Personal info (student name, TLC, group members) is collected per-submission.

ALTER TABLE public.submissions
  ADD COLUMN student_name TEXT,
  ADD COLUMN tlc_name TEXT,
  ADD COLUMN tlc_email TEXT,
  ADD COLUMN group_member_names TEXT;

-- Notify PostgREST to reload schema cache
NOTIFY pgrst, 'reload schema';
