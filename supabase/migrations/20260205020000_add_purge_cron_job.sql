-- Migration: add_purge_cron_job
-- Schedules daily cleanup of soft-deleted contests past 90-day retention
-- Requires pg_cron and pg_net extensions (available on Supabase Pro plan)

-- Enable extensions (pg_cron is pre-installed on Supabase, just needs enabling)
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Grant usage to postgres role (required for Supabase hosted)
GRANT USAGE ON SCHEMA cron TO postgres;

-- Schedule daily purge at 3:00 AM UTC
-- Calls the purge-deleted-contests edge function via pg_net
SELECT cron.schedule(
  'purge-deleted-contests-daily',
  '0 3 * * *',
  $$
  SELECT net.http_post(
    url := (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'supabase_url') || '/functions/v1/purge-deleted-contests',
    headers := jsonb_build_object(
      'Authorization', 'Bearer ' || (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'service_role_key'),
      'Content-Type', 'application/json'
    ),
    body := '{}'::jsonb
  );
  $$
);
