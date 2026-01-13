-- Story 2-5: Create categories table for contest category management
-- Migration: create_categories_table

-- Categories table
CREATE TABLE IF NOT EXISTS public.categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contest_id UUID NOT NULL REFERENCES public.contests(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('video', 'photo')),
  rules TEXT,
  description TEXT,
  deadline TIMESTAMPTZ NOT NULL,
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'closed')),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes for performance
CREATE INDEX idx_categories_contest_id ON public.categories(contest_id);
CREATE INDEX idx_categories_status ON public.categories(status);
CREATE INDEX idx_categories_deadline ON public.categories(deadline);

-- Enable Row Level Security
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Admins can manage categories (full CRUD)
CREATE POLICY "Admins can manage categories"
  ON public.categories
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Comment on table for documentation
COMMENT ON TABLE public.categories IS 'Contest categories - each contest can have multiple video/photo categories';
COMMENT ON COLUMN public.categories.type IS 'Category type: video (Bunny Stream) or photo (Bunny Storage)';
COMMENT ON COLUMN public.categories.status IS 'Category status: draft (editable), published (accepting submissions), closed (no more submissions)';
