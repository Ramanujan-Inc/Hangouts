-- Migration: Add external_album_url to hangouts table
-- Created At: 2026-09-07

ALTER TABLE hangouts ADD COLUMN IF NOT EXISTS external_album_url TEXT;
