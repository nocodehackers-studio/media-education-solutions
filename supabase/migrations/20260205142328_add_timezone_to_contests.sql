-- Add timezone column to contests table
-- IANA timezone identifier for deadline display (e.g., America/New_York)

ALTER TABLE public.contests
ADD COLUMN timezone TEXT NOT NULL DEFAULT 'America/New_York';

COMMENT ON COLUMN public.contests.timezone IS 'IANA timezone identifier for deadline display (e.g., America/New_York)';
