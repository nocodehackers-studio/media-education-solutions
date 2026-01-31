-- Story 5-1: Create reviews table for judge review tracking
-- Reviews track individual judge ratings and feedback per submission

CREATE TABLE public.reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  submission_id UUID NOT NULL REFERENCES public.submissions(id) ON DELETE CASCADE,
  judge_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  rating INTEGER CHECK (rating >= 1 AND rating <= 10),
  feedback TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(submission_id, judge_id)
);

-- Index for efficient judge lookups
CREATE INDEX idx_reviews_judge_id ON public.reviews(judge_id);
CREATE INDEX idx_reviews_submission_id ON public.reviews(submission_id);

-- Auto-update updated_at timestamp (reuses existing function from contests migration)
CREATE TRIGGER update_reviews_updated_at
  BEFORE UPDATE ON public.reviews
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Enable RLS
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

-- Judge policies: can manage own reviews only
CREATE POLICY "Judges can view own reviews"
  ON public.reviews FOR SELECT
  USING (auth.uid() = judge_id);

CREATE POLICY "Judges can create own reviews"
  ON public.reviews FOR INSERT
  WITH CHECK (auth.uid() = judge_id);

CREATE POLICY "Judges can update own reviews"
  ON public.reviews FOR UPDATE
  USING (auth.uid() = judge_id)
  WITH CHECK (auth.uid() = judge_id);

-- Admin policies: full access
CREATE POLICY "Admins have full access to reviews"
  ON public.reviews FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );
