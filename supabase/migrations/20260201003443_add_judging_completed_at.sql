-- Story 5-6: Add judging_completed_at column and read-only enforcement triggers

-- Add completion tracking to categories (IF NOT EXISTS for idempotency)
ALTER TABLE public.categories
ADD COLUMN IF NOT EXISTS judging_completed_at TIMESTAMPTZ DEFAULT NULL;

-- Index for queries filtering completed/incomplete
CREATE INDEX IF NOT EXISTS idx_categories_judging_completed
  ON public.categories(judging_completed_at)
  WHERE judging_completed_at IS NOT NULL;

-- Trigger function: Prevent review modifications on completed categories
CREATE OR REPLACE FUNCTION public.prevent_review_modification_on_completed()
RETURNS TRIGGER
SET search_path = public
AS $$
BEGIN
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

-- Trigger function: Prevent ranking modifications on completed categories
CREATE OR REPLACE FUNCTION public.prevent_ranking_modification_on_completed()
RETURNS TRIGGER
SET search_path = public
AS $$
BEGIN
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

-- Attach triggers to reviews table (if it exists)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'reviews') THEN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'prevent_review_modification') THEN
      CREATE TRIGGER prevent_review_modification
        BEFORE INSERT OR UPDATE OR DELETE ON public.reviews
        FOR EACH ROW
        EXECUTE FUNCTION public.prevent_review_modification_on_completed();
    END IF;
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'rankings') THEN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'prevent_ranking_modification') THEN
      CREATE TRIGGER prevent_ranking_modification
        BEFORE INSERT OR UPDATE OR DELETE ON public.rankings
        FOR EACH ROW
        EXECUTE FUNCTION public.prevent_ranking_modification_on_completed();
    END IF;
  END IF;
END;
$$;
