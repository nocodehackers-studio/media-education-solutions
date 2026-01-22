-- Story 3-1: Add judge assignment columns to categories table
-- Migration: add_judge_assignment_to_categories
-- Date: 2026-01-22
--
-- This migration adds:
-- 1. assigned_judge_id (FK to profiles, nullable) - the judge assigned to review this category
-- 2. invited_at (TIMESTAMPTZ, nullable) - when the judge was invited (email sent)
-- 3. Index on assigned_judge_id for efficient lookup

-- =============================================================================
-- STEP 1: Add assigned_judge_id column
-- =============================================================================
ALTER TABLE public.categories
ADD COLUMN assigned_judge_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL;

-- =============================================================================
-- STEP 2: Add invited_at column
-- =============================================================================
ALTER TABLE public.categories
ADD COLUMN invited_at TIMESTAMPTZ;

-- =============================================================================
-- STEP 3: Create partial index for looking up categories by judge
-- =============================================================================
-- Partial index only indexes rows where judge is assigned (more efficient)
CREATE INDEX idx_categories_assigned_judge_id
ON public.categories(assigned_judge_id)
WHERE assigned_judge_id IS NOT NULL;

-- =============================================================================
-- STEP 4: Comments for documentation
-- =============================================================================
COMMENT ON COLUMN public.categories.assigned_judge_id IS 'Judge assigned to review submissions in this category (FK to profiles)';
COMMENT ON COLUMN public.categories.invited_at IS 'Timestamp when judge invitation email was sent';
