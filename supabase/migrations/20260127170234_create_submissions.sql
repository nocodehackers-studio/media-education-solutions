-- Story 4-4: Create submissions table for video/photo uploads
-- Submissions link participants to their category entries

-- Create submissions table
CREATE TABLE public.submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  participant_id UUID NOT NULL REFERENCES public.participants(id) ON DELETE CASCADE,
  category_id UUID NOT NULL REFERENCES public.categories(id) ON DELETE CASCADE,
  media_type TEXT NOT NULL CHECK (media_type IN ('video', 'photo')),
  media_url TEXT,
  bunny_video_id TEXT,
  thumbnail_url TEXT,
  status TEXT NOT NULL DEFAULT 'uploading' CHECK (status IN ('uploading', 'submitted', 'disqualified')),
  submitted_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  -- One submission per participant per category
  UNIQUE(category_id, participant_id)
);

-- Enable RLS
ALTER TABLE public.submissions ENABLE ROW LEVEL SECURITY;

-- Index for common queries
CREATE INDEX idx_submissions_participant_id ON public.submissions(participant_id);
CREATE INDEX idx_submissions_category_id ON public.submissions(category_id);
CREATE INDEX idx_submissions_status ON public.submissions(status);

-- RLS Policies
-- Admin can do everything
CREATE POLICY "Admin full access to submissions"
  ON public.submissions
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Judge can read submissions for their assigned categories
CREATE POLICY "Judge read assigned category submissions"
  ON public.submissions
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.categories c
      JOIN public.profiles p ON p.id = auth.uid()
      WHERE c.id = submissions.category_id
        AND c.assigned_judge_id = p.id
        AND p.role = 'judge'
    )
  );

-- Participants access via Edge Functions only (no direct RLS)
-- Edge Functions use service_role key

-- Trigger for updated_at
CREATE OR REPLACE FUNCTION update_submissions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER submissions_updated_at
  BEFORE UPDATE ON public.submissions
  FOR EACH ROW
  EXECUTE FUNCTION update_submissions_updated_at();
