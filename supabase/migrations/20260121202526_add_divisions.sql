-- Story 2-9: Add divisions table for organizing categories within contests
-- Migration: add_divisions
-- Date: 2026-01-21
--
-- This migration:
-- 1. Creates divisions table
-- 2. Creates default "General" division for each existing contest
-- 3. Adds division_id to categories (nullable)
-- 4. Updates existing categories to point to default division
-- 5. Makes division_id NOT NULL
-- 6. Removes contest_id from categories (derived via division)

-- =============================================================================
-- STEP 1: Create divisions table
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.divisions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contest_id UUID NOT NULL REFERENCES public.contests(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(contest_id, name)
);

-- Indexes for performance
CREATE INDEX idx_divisions_contest_id ON public.divisions(contest_id);
CREATE INDEX idx_divisions_display_order ON public.divisions(display_order);

-- Enable Row Level Security
ALTER TABLE public.divisions ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Admins can manage divisions (full CRUD)
CREATE POLICY "Admins can manage divisions"
  ON public.divisions
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
COMMENT ON TABLE public.divisions IS 'Contest divisions - organize categories by competition level (e.g., High School, Teen, Teachers)';
COMMENT ON COLUMN public.divisions.display_order IS 'Order in which divisions appear in the UI (lower numbers first)';

-- =============================================================================
-- STEP 2: Create default "General" division for each existing contest
-- =============================================================================
INSERT INTO public.divisions (contest_id, name, display_order)
SELECT id, 'General', 0
FROM public.contests
WHERE NOT EXISTS (
  SELECT 1 FROM public.divisions d WHERE d.contest_id = contests.id
);

-- =============================================================================
-- STEP 3: Add division_id to categories (nullable initially)
-- =============================================================================
ALTER TABLE public.categories
ADD COLUMN division_id UUID REFERENCES public.divisions(id) ON DELETE CASCADE;

-- =============================================================================
-- STEP 4: Update existing categories to point to their contest's default division
-- =============================================================================
UPDATE public.categories
SET division_id = (
  SELECT d.id
  FROM public.divisions d
  WHERE d.contest_id = categories.contest_id
  AND d.name = 'General'
  LIMIT 1
)
WHERE division_id IS NULL;

-- =============================================================================
-- STEP 5: Make division_id NOT NULL
-- =============================================================================
ALTER TABLE public.categories
ALTER COLUMN division_id SET NOT NULL;

-- =============================================================================
-- STEP 6: Drop contest_id from categories (now derived via division)
-- =============================================================================
-- First drop the index
DROP INDEX IF EXISTS idx_categories_contest_id;

-- Drop the column (FK constraint is dropped automatically)
ALTER TABLE public.categories
DROP COLUMN contest_id;

-- =============================================================================
-- STEP 7: Add index on division_id for categories
-- =============================================================================
CREATE INDEX idx_categories_division_id ON public.categories(division_id);
