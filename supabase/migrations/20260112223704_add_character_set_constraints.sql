-- Migration: Add character set validation to contest_code and participant code
-- Story: 2-3-create-contest (QA fix)
-- Date: 2026-01-12
--
-- This enforces AC2 character requirements at the database level:
-- - contest_code: 6 chars from A-H, J-N, P-Z, 2-9 (excludes confusing 0, 1, I, O)
-- - participants.code: 8 numeric digits only

-- Drop existing length-only constraint on contests.contest_code
ALTER TABLE public.contests
  DROP CONSTRAINT IF EXISTS contests_contest_code_check;

-- Add new constraint with character set validation
-- Allowed: A-H, J-N, P-Z, 2-9 (uppercase only, no 0, 1, I, O)
ALTER TABLE public.contests
  ADD CONSTRAINT contests_contest_code_check
  CHECK (
    LENGTH(contest_code) = 6
    AND contest_code ~ '^[ABCDEFGHJKLMNPQRSTUVWXYZ23456789]{6}$'
  );

-- Drop existing length-only constraint on participants.code
ALTER TABLE public.participants
  DROP CONSTRAINT IF EXISTS participants_code_check;

-- Add new constraint with numeric-only validation
-- Allowed: 8 digits (0-9)
ALTER TABLE public.participants
  ADD CONSTRAINT participants_code_check
  CHECK (
    LENGTH(code) = 8
    AND code ~ '^[0-9]{8}$'
  );
