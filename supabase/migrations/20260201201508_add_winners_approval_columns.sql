-- Story 6-5: Add category approval and winners page tracking columns

-- Add category approval columns
ALTER TABLE public.categories
ADD COLUMN IF NOT EXISTS approved_for_winners BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS approved_at TIMESTAMPTZ;

-- Add winners page tracking columns to contests
-- NOTE: winners_page_password already exists as TEXT column
ALTER TABLE public.contests
ADD COLUMN IF NOT EXISTS winners_page_enabled BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS winners_page_generated_at TIMESTAMPTZ;
