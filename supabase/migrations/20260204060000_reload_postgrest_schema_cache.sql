-- Force PostgREST schema cache reload
-- Resolves PGRST200 error: "Could not find a relationship between 'submissions' and 'reviews'"
NOTIFY pgrst, 'reload schema';
