-- Migration: Add NOT NULL constraint to participants.contest_id
-- Story: 2-3-create-contest (QA fix)
-- Date: 2026-01-12
--
-- This fixes data integrity issue where participants could exist without a contest.
-- The constraint was missing in 00003_create_contests_tables.sql

-- Add NOT NULL constraint to contest_id
-- Note: This will fail if any existing rows have NULL contest_id
ALTER TABLE public.participants
  ALTER COLUMN contest_id SET NOT NULL;
