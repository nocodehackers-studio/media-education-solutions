-- Fix: Infinite recursion in "Admins can read all profiles" RLS policy
-- Issue: The policy queries profiles table, which triggers RLS check, causing infinite loop
-- Solution: Use SECURITY DEFINER function to bypass RLS during admin check

-- Drop the problematic policy
DROP POLICY IF EXISTS "Admins can read all profiles" ON public.profiles;

-- Create a security definer function to check if user is admin
-- SECURITY DEFINER = runs with elevated privileges, bypassing RLS
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE id = auth.uid()
    AND role = 'admin'
  );
$$;

-- Recreate the policy using the function (no more recursion)
CREATE POLICY "Admins can read all profiles"
  ON public.profiles
  FOR SELECT
  USING (is_admin());
