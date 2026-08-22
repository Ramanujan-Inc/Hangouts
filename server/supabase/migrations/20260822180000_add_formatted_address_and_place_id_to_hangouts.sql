-- Migration: Add formatted_address and place_id to hangouts table
ALTER TABLE hangouts
ADD COLUMN IF NOT EXISTS formatted_address TEXT,
ADD COLUMN IF NOT EXISTS place_id VARCHAR(255);
