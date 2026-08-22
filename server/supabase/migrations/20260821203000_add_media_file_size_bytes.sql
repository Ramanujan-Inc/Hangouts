-- Add file_size_bytes column to media table for storage quota tracking

ALTER TABLE "public"."media" ADD COLUMN IF NOT EXISTS file_size_bytes BIGINT NOT NULL DEFAULT 0;
