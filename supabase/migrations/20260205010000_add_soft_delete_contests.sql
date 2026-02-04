-- Migration: add_soft_delete_contests
-- Adds soft delete support for contests with 90-day retention
-- Fixes notification_logs FK constraints that block contest deletion

-- 1. Add 'deleted' to contest status CHECK constraint
ALTER TABLE public.contests DROP CONSTRAINT IF EXISTS contests_status_check;
ALTER TABLE public.contests
  ADD CONSTRAINT contests_status_check
  CHECK (status IN ('draft', 'published', 'closed', 'reviewed', 'finished', 'deleted'));

-- 2. Add deleted_at column for tracking when contest was soft-deleted
ALTER TABLE public.contests ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ DEFAULT NULL;

-- 3. Fix notification_logs FK constraints with ON DELETE SET NULL
--    These were missing cascade behavior, causing delete failures
ALTER TABLE notification_logs
  DROP CONSTRAINT IF EXISTS notification_logs_related_contest_id_fkey;
ALTER TABLE notification_logs
  ADD CONSTRAINT notification_logs_related_contest_id_fkey
  FOREIGN KEY (related_contest_id) REFERENCES contests(id) ON DELETE SET NULL;

ALTER TABLE notification_logs
  DROP CONSTRAINT IF EXISTS notification_logs_related_category_id_fkey;
ALTER TABLE notification_logs
  ADD CONSTRAINT notification_logs_related_category_id_fkey
  FOREIGN KEY (related_category_id) REFERENCES categories(id) ON DELETE SET NULL;

-- 4. Partial index for efficient cleanup queries on soft-deleted contests
CREATE INDEX IF NOT EXISTS idx_contests_deleted_at
  ON public.contests (deleted_at)
  WHERE deleted_at IS NOT NULL;
