-- Add is_cover boolean column to media table
ALTER TABLE media ADD COLUMN IF NOT EXISTS is_cover BOOLEAN NOT NULL DEFAULT FALSE;
