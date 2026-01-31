-- Story 5-1: RPC function for fetching submissions for judge review
-- SECURITY DEFINER ensures anonymous judging by controlling column access

CREATE OR REPLACE FUNCTION public.get_submissions_for_review(p_category_id UUID)
RETURNS TABLE (
  id UUID,
  media_type TEXT,
  media_url TEXT,
  thumbnail_url TEXT,
  bunny_video_id TEXT,
  status TEXT,
  submitted_at TIMESTAMPTZ,
  participant_code TEXT,
  review_id UUID,
  rating INTEGER,
  feedback TEXT
)
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  -- Verify the current user is the assigned judge for this category
  IF NOT EXISTS (
    SELECT 1 FROM public.categories
    WHERE categories.id = p_category_id
    AND categories.assigned_judge_id = auth.uid()
  ) THEN
    RAISE EXCEPTION 'Not authorized for this category';
  END IF;

  RETURN QUERY
  SELECT
    s.id,
    s.media_type,
    s.media_url,
    s.thumbnail_url,
    s.bunny_video_id,
    s.status,
    s.submitted_at,
    p.code AS participant_code,
    r.id AS review_id,
    r.rating,
    r.feedback
  FROM public.submissions s
  JOIN public.participants p ON p.id = s.participant_id
  LEFT JOIN public.reviews r ON r.submission_id = s.id AND r.judge_id = auth.uid()
  WHERE s.category_id = p_category_id
  AND s.status = 'submitted'
  ORDER BY s.submitted_at ASC;
END;
$$;

-- Restrict access: only authenticated users can call this function
REVOKE EXECUTE ON FUNCTION public.get_submissions_for_review FROM public, anon;
GRANT EXECUTE ON FUNCTION public.get_submissions_for_review TO authenticated;
