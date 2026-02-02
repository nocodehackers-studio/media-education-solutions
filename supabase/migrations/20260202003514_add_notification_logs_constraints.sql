-- Story 7-1: Add constraints and trigger for notification_logs
-- Fixes: F3 (status CHECK), F4 (type CHECK), F5 (NOT NULL timestamps), F6 (updated_at trigger)

-- F3: CHECK constraint on status column
ALTER TABLE notification_logs
  ADD CONSTRAINT notification_logs_status_check
  CHECK (status IN ('pending', 'sent', 'failed', 'permanently_failed'));

-- F4: CHECK constraint on type column
ALTER TABLE notification_logs
  ADD CONSTRAINT notification_logs_type_check
  CHECK (type IN ('judge_invitation', 'judge_complete', 'tlc_results', 'contest_status'));

-- F5: NOT NULL constraints on timestamps
ALTER TABLE notification_logs
  ALTER COLUMN created_at SET NOT NULL;

ALTER TABLE notification_logs
  ALTER COLUMN updated_at SET NOT NULL;

-- F6: Auto-update updated_at trigger
CREATE OR REPLACE FUNCTION update_notification_logs_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_notification_logs_updated_at
  BEFORE UPDATE ON notification_logs
  FOR EACH ROW
  EXECUTE FUNCTION update_notification_logs_updated_at();
