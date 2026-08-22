-- Add color column to notes table
ALTER TABLE public.notes ADD COLUMN IF NOT EXISTS color VARCHAR(20) NOT NULL DEFAULT 'butter';
