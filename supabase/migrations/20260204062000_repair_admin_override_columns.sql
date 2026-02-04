-- Repair: Re-add admin override columns that are missing despite migration being recorded
-- Original migration 20260201162435 was applied but columns don't exist

-- Rankings table override columns
ALTER TABLE public.rankings
ADD COLUMN IF NOT EXISTS admin_ranking_override UUID REFERENCES public.submissions(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS admin_ranking_override_at TIMESTAMPTZ;

-- Reload PostgREST schema cache
NOTIFY pgrst, 'reload schema';
