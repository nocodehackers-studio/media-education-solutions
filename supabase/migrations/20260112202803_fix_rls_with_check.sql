-- Migration: Fix RLS policies to include WITH CHECK clauses
-- Story: 2-3-create-contest
-- Issue: AC5 violation - policies only had USING, allowing non-admin insert/update
-- Date: 2026-01-12

-- Drop existing policies that only have USING clause
DROP POLICY IF EXISTS "Admins can manage contests" ON public.contests;
DROP POLICY IF EXISTS "Admins can manage participants" ON public.participants;

-- Recreate contests policy with both USING and WITH CHECK
-- USING: Controls which rows can be selected/updated/deleted
-- WITH CHECK: Controls which rows can be inserted or updated to
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
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Recreate participants policy with both USING and WITH CHECK
CREATE POLICY "Admins can manage participants"
  ON public.participants
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );
