-- TEST ONLY: Backdate deleted contests to trigger purge
-- This simulates 91 days passing for testing the purge function
UPDATE public.contests
SET deleted_at = NOW() - INTERVAL '91 days'
WHERE status = 'deleted';
