-- Repair: Recreate reviews table that was dropped after original migration
-- Original migration 20260131020610 was applied but table no longer exists

CREATE TABLE IF NOT EXISTS public.reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  submission_id UUID NOT NULL REFERENCES public.submissions(id) ON DELETE CASCADE,
  judge_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  rating INTEGER CHECK (rating >= 1 AND rating <= 10),
  feedback TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  -- Admin override columns (from migration 20260201162435)
  admin_feedback_override TEXT,
  admin_feedback_override_at TIMESTAMPTZ,
  UNIQUE(submission_id, judge_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_reviews_judge_id ON public.reviews(judge_id);
CREATE INDEX IF NOT EXISTS idx_reviews_submission_id ON public.reviews(submission_id);

-- Auto-update updated_at trigger
DROP TRIGGER IF EXISTS update_reviews_updated_at ON public.reviews;
CREATE TRIGGER update_reviews_updated_at
  BEFORE UPDATE ON public.reviews
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Enable RLS
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

-- Judge policies
DROP POLICY IF EXISTS "Judges can view own reviews" ON public.reviews;
CREATE POLICY "Judges can view own reviews"
  ON public.reviews FOR SELECT
  USING (auth.uid() = judge_id);

DROP POLICY IF EXISTS "Judges can create own reviews" ON public.reviews;
CREATE POLICY "Judges can create own reviews"
  ON public.reviews FOR INSERT
  WITH CHECK (auth.uid() = judge_id);

DROP POLICY IF EXISTS "Judges can update own reviews" ON public.reviews;
CREATE POLICY "Judges can update own reviews"
  ON public.reviews FOR UPDATE
  USING (auth.uid() = judge_id)
  WITH CHECK (auth.uid() = judge_id);

-- Admin policies
DROP POLICY IF EXISTS "Admins have full access to reviews" ON public.reviews;
CREATE POLICY "Admins have full access to reviews"
  ON public.reviews FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Reload PostgREST schema cache
NOTIFY pgrst, 'reload schema';
