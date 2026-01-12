-- Migration: Create contests and participants tables
-- Story: 2-3-create-contest
-- Date: 2026-01-12

-- Contests table
CREATE TABLE IF NOT EXISTS public.contests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  slug TEXT UNIQUE NOT NULL,
  contest_code TEXT UNIQUE NOT NULL CHECK (LENGTH(contest_code) = 6),
  rules TEXT,
  cover_image_url TEXT,
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'closed', 'reviewed', 'finished')),
  winners_page_password TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Participants table
CREATE TABLE IF NOT EXISTS public.participants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contest_id UUID NOT NULL REFERENCES public.contests(id) ON DELETE CASCADE,
  code TEXT NOT NULL CHECK (LENGTH(code) = 8),
  status TEXT DEFAULT 'unused' CHECK (status IN ('unused', 'used')),
  name TEXT,
  organization_name TEXT,
  tlc_name TEXT,
  tlc_email TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(contest_id, code)
);

-- Indexes
CREATE INDEX idx_contests_status ON public.contests(status);
CREATE INDEX idx_contests_contest_code ON public.contests(contest_code);
CREATE INDEX idx_participants_contest_id ON public.participants(contest_id);
CREATE INDEX idx_participants_code ON public.participants(code);

-- Enable RLS
ALTER TABLE public.contests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.participants ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Admin full access
CREATE POLICY "Admins can manage contests"
  ON public.contests
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Admins can manage participant codes"
  ON public.participants
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Updated_at trigger function (reuse existing if available, or create)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger to contests table
CREATE TRIGGER update_contests_updated_at
  BEFORE UPDATE ON public.contests
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
