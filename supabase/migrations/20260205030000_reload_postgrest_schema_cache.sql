-- Force PostgREST schema cache reload
-- Ensures PostgREST recognizes the new deleted_at column on contests
NOTIFY pgrst, 'reload schema';
