-- Migration: add_auto_close_cron_and_trigger
-- Part A: Auto-close contest when all its categories reach 'closed' status
-- Part B: Trigger on categories table to invoke Part A
-- Part C: pg_cron job to close expired categories every minute via Edge Function

-- ============================================================
-- Part A: Contest auto-close trigger function
-- ============================================================

CREATE OR REPLACE FUNCTION public.auto_close_contest_when_all_categories_closed()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_contest_id UUID;
  v_open_count INTEGER;
BEGIN
  -- Only fire when category status changes TO 'closed'
  IF NEW.status = 'closed' AND (OLD.status IS DISTINCT FROM 'closed') THEN
    -- Get contest_id via division
    SELECT d.contest_id INTO v_contest_id
    FROM public.divisions d
    WHERE d.id = NEW.division_id;

    -- F2 fix: Lock contest row to serialize concurrent trigger invocations
    PERFORM 1 FROM public.contests WHERE id = v_contest_id FOR UPDATE;

    -- Count non-closed categories in this contest
    SELECT COUNT(*) INTO v_open_count
    FROM public.categories cat
    JOIN public.divisions div ON cat.division_id = div.id
    WHERE div.contest_id = v_contest_id
      AND cat.status != 'closed';

    -- If ALL categories are closed and contest is published, close the contest
    IF v_open_count = 0 THEN
      UPDATE public.contests
      SET status = 'closed'
      WHERE id = v_contest_id
        AND status = 'published';
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

-- ============================================================
-- Part B: Trigger on categories table
-- ============================================================

CREATE TRIGGER trg_auto_close_contest_on_category_close
  AFTER UPDATE OF status ON public.categories
  FOR EACH ROW
  WHEN (NEW.status = 'closed' AND OLD.status IS DISTINCT FROM 'closed')
  EXECUTE FUNCTION public.auto_close_contest_when_all_categories_closed();

-- ============================================================
-- Part C: Cron job — close expired categories every minute
-- ============================================================
-- pg_cron and pg_net extensions already enabled (migration 20260205020000)

SELECT cron.schedule(
  'close-expired-categories-every-minute',
  '* * * * *',
  $$
  SELECT net.http_post(
    url := (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'supabase_url')
           || '/functions/v1/close-expired-categories',
    headers := jsonb_build_object(
      'Authorization', 'Bearer ' || (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'service_role_key'),
      'Content-Type', 'application/json'
    ),
    body := '{}'::jsonb
  );
  $$
);
