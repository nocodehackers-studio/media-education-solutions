-- Story 5-5: Atomic save_rankings RPC function
-- Replaces non-atomic delete+insert with a single transaction

CREATE OR REPLACE FUNCTION save_rankings(
  p_category_id UUID,
  p_judge_id UUID,
  p_rankings JSONB
) RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Verify the caller is the judge
  IF auth.uid() IS DISTINCT FROM p_judge_id THEN
    RAISE EXCEPTION 'Unauthorized: judge_id does not match authenticated user';
  END IF;

  -- Atomic: delete existing + insert new in a single transaction
  DELETE FROM rankings
  WHERE category_id = p_category_id AND judge_id = p_judge_id;

  INSERT INTO rankings (category_id, judge_id, rank, submission_id)
  SELECT
    p_category_id,
    p_judge_id,
    (r->>'rank')::integer,
    (r->>'submission_id')::uuid
  FROM jsonb_array_elements(p_rankings) AS r;
END;
$$;
