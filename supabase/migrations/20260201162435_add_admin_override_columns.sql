-- Story 6-3: Add admin override columns for feedback and rankings
-- Allows admin to override judge feedback and ranking positions
-- Original data is always preserved (never overwritten)

-- Task 1: Add admin override columns to reviews table
ALTER TABLE public.reviews
ADD COLUMN IF NOT EXISTS admin_feedback_override TEXT,
ADD COLUMN IF NOT EXISTS admin_feedback_override_at TIMESTAMPTZ;

-- Task 2: Add admin override columns to rankings table
ALTER TABLE public.rankings
ADD COLUMN IF NOT EXISTS admin_ranking_override UUID REFERENCES public.submissions(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS admin_ranking_override_at TIMESTAMPTZ;

-- Task 3: Update completion triggers to allow admin override column writes

-- Updated trigger: Allow admin override columns even on completed categories
CREATE OR REPLACE FUNCTION public.prevent_review_modification_on_completed()
RETURNS TRIGGER
SET search_path = public
AS $$
BEGIN
  -- Allow UPDATE if ONLY admin override columns changed
  IF TG_OP = 'UPDATE' AND
     OLD.submission_id IS NOT DISTINCT FROM NEW.submission_id AND
     OLD.judge_id IS NOT DISTINCT FROM NEW.judge_id AND
     OLD.rating IS NOT DISTINCT FROM NEW.rating AND
     OLD.feedback IS NOT DISTINCT FROM NEW.feedback THEN
    RETURN NEW;
  END IF;

  IF EXISTS (
    SELECT 1 FROM categories c
    JOIN submissions s ON s.category_id = c.id
    WHERE s.id = COALESCE(NEW.submission_id, OLD.submission_id)
    AND c.judging_completed_at IS NOT NULL
  ) THEN
    RAISE EXCEPTION 'Cannot modify reviews for a completed category';
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Updated trigger: Allow admin override columns even on completed categories
CREATE OR REPLACE FUNCTION public.prevent_ranking_modification_on_completed()
RETURNS TRIGGER
SET search_path = public
AS $$
BEGIN
  -- Allow UPDATE if ONLY admin override columns changed
  IF TG_OP = 'UPDATE' AND
     OLD.category_id IS NOT DISTINCT FROM NEW.category_id AND
     OLD.judge_id IS NOT DISTINCT FROM NEW.judge_id AND
     OLD.rank IS NOT DISTINCT FROM NEW.rank AND
     OLD.submission_id IS NOT DISTINCT FROM NEW.submission_id THEN
    RETURN NEW;
  END IF;

  IF EXISTS (
    SELECT 1 FROM categories
    WHERE id = COALESCE(NEW.category_id, OLD.category_id)
    AND judging_completed_at IS NOT NULL
  ) THEN
    RAISE EXCEPTION 'Cannot modify rankings for a completed category';
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;
