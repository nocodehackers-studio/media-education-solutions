-- Fix: Judges could not see assigned categories because only admin policies existed.
-- The listByJudge() query joins categories → divisions → contests,
-- and Supabase enforces RLS on every table in a join.

-- 1. Categories: judge can see categories assigned to them
CREATE POLICY "Judges can view assigned categories"
  ON public.categories
  FOR SELECT
  TO authenticated
  USING (
    assigned_judge_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'judge'
    )
  );

-- 2. Divisions: judge can see divisions containing their assigned categories
CREATE POLICY "Judges can view divisions with assigned categories"
  ON public.divisions
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.categories
      JOIN public.profiles ON profiles.id = categories.assigned_judge_id
      WHERE categories.division_id = divisions.id
      AND categories.assigned_judge_id = auth.uid()
      AND profiles.role = 'judge'
    )
  );

-- 3. Contests: judge can see contests containing their assigned categories
CREATE POLICY "Judges can view contests with assigned categories"
  ON public.contests
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.divisions
      JOIN public.categories ON categories.division_id = divisions.id
      JOIN public.profiles ON profiles.id = categories.assigned_judge_id
      WHERE divisions.contest_id = contests.id
      AND categories.assigned_judge_id = auth.uid()
      AND profiles.role = 'judge'
    )
  );
