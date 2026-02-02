-- Migration: create_notification_logs_table
-- Story 7-1: Email Infrastructure Setup (Brevo Integration)

CREATE TABLE notification_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type TEXT NOT NULL,
  recipient_email TEXT NOT NULL,
  recipient_id UUID REFERENCES profiles(id),
  related_contest_id UUID REFERENCES contests(id),
  related_category_id UUID REFERENCES categories(id),
  brevo_message_id TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  error_message TEXT,
  retry_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for admin dashboard queries
CREATE INDEX idx_notification_logs_contest ON notification_logs(related_contest_id);
CREATE INDEX idx_notification_logs_status ON notification_logs(status);
CREATE INDEX idx_notification_logs_type ON notification_logs(type);

-- RLS
ALTER TABLE notification_logs ENABLE ROW LEVEL SECURITY;

-- Admin can read all logs
CREATE POLICY "Admin can read notification logs"
  ON notification_logs FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- No INSERT/UPDATE policy needed for authenticated users
-- Edge Function uses service_role_key which bypasses RLS
