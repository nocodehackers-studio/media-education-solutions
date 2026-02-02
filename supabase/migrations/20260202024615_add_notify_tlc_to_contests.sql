-- Story 7-4: Add notify_tlc toggle to contests table
-- Controls whether T/L/C (Teacher/Leader/Coach) emails are sent when contest finishes
ALTER TABLE contests ADD COLUMN notify_tlc BOOLEAN NOT NULL DEFAULT false;
