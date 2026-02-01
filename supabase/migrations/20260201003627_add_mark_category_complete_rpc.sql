-- Story 5-6: RPC function to mark a category as complete
-- Validates judge assignment, review completeness, and ranking existence

CREATE OR REPLACE FUNCTION public.mark_category_complete(p_category_id UUID)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_judge_id UUID;
  v_completed_at TIMESTAMPTZ;
  v_total_submissions INT;
  v_total_reviews INT;
  v_total_rankings INT;
BEGIN
  v_judge_id := auth.uid();

  -- Verify caller is assigned judge and get current completion status
  SELECT judging_completed_at INTO v_completed_at
  FROM categories
  WHERE id = p_category_id AND assigned_judge_id = v_judge_id;

  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'error', 'NOT_ASSIGNED_JUDGE');
  END IF;

  -- Check not already completed
  IF v_completed_at IS NOT NULL THEN
    RETURN json_build_object('success', false, 'error', 'ALREADY_COMPLETED');
  END IF;

  -- Count submitted submissions in category
  SELECT COUNT(*) INTO v_total_submissions
  FROM submissions
  WHERE category_id = p_category_id AND status = 'submitted';

  IF v_total_submissions = 0 THEN
    RETURN json_build_object('success', false, 'error', 'NO_SUBMISSIONS');
  END IF;

  -- Count reviews by this judge for submissions in this category
  SELECT COUNT(*) INTO v_total_reviews
  FROM reviews r
  JOIN submissions s ON s.id = r.submission_id
  WHERE s.category_id = p_category_id AND r.judge_id = v_judge_id;

  IF v_total_reviews < v_total_submissions THEN
    RETURN json_build_object('success', false, 'error', 'REVIEWS_INCOMPLETE');
  END IF;

  -- Count rankings by this judge for this category
  SELECT COUNT(*) INTO v_total_rankings
  FROM rankings
  WHERE category_id = p_category_id AND judge_id = v_judge_id;

  IF v_total_rankings < 3 THEN
    RETURN json_build_object('success', false, 'error', 'RANKINGS_INCOMPLETE');
  END IF;

  -- Mark complete
  UPDATE categories
  SET judging_completed_at = now()
  WHERE id = p_category_id;

  RETURN json_build_object('success', true, 'completed_at', now()::text);
END;
$$;
