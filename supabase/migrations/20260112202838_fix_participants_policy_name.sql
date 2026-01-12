-- Migration: Clean up old participants RLS policy with wrong name
-- Story: 2-3-create-contest
-- Issue: Original policy named "Admins can manage participant codes" needs to be dropped
--        Previous migration created new policy "Admins can manage participants" with WITH CHECK
-- Date: 2026-01-12

-- Drop the old policy with the original name (without WITH CHECK)
DROP POLICY IF EXISTS "Admins can manage participant codes" ON public.participants;
