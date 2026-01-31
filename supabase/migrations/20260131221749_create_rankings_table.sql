-- Story 5-5: Create rankings table for judge top 3 ranking
-- Rankings store judge's top 3 picks per category

CREATE TABLE public.rankings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id UUID NOT NULL REFERENCES public.categories(id) ON DELETE CASCADE,
  judge_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  rank INTEGER NOT NULL CHECK (rank >= 1 AND rank <= 3),
  submission_id UUID NOT NULL REFERENCES public.submissions(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(category_id, judge_id, rank),
  UNIQUE(category_id, judge_id, submission_id)
);

-- Indexes
CREATE INDEX idx_rankings_judge_id ON public.rankings(judge_id);
CREATE INDEX idx_rankings_category_id ON public.rankings(category_id);

-- Auto-update updated_at trigger (reuses existing function)
CREATE TRIGGER update_rankings_updated_at
  BEFORE UPDATE ON public.rankings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- RLS
ALTER TABLE public.rankings ENABLE ROW LEVEL SECURITY;

-- Judge policies: can manage own rankings only
CREATE POLICY "Judges can view own rankings"
  ON public.rankings FOR SELECT
  USING (auth.uid() = judge_id);

CREATE POLICY "Judges can create own rankings"
  ON public.rankings FOR INSERT
  WITH CHECK (auth.uid() = judge_id);

CREATE POLICY "Judges can update own rankings"
  ON public.rankings FOR UPDATE
  USING (auth.uid() = judge_id)
  WITH CHECK (auth.uid() = judge_id);

CREATE POLICY "Judges can delete own rankings"
  ON public.rankings FOR DELETE
  USING (auth.uid() = judge_id);

-- Admin policies: full access
CREATE POLICY "Admins have full access to rankings"
  ON public.rankings FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );
