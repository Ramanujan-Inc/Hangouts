-- Migration: Add invite_code to groups and hangouts for public share links
-- Timestamp: 20260903110000

ALTER TABLE public.groups
ADD COLUMN IF NOT EXISTS invite_code VARCHAR(64) UNIQUE;

ALTER TABLE public.hangouts
ADD COLUMN IF NOT EXISTS invite_code VARCHAR(64) UNIQUE;

-- Backfill existing groups and hangouts with random 12-character hex tokens
UPDATE public.groups
SET invite_code = substr(md5(random()::text || id::text), 1, 12)
WHERE invite_code IS NULL;

UPDATE public.hangouts
SET invite_code = substr(md5(random()::text || id::text), 1, 12)
WHERE invite_code IS NULL;

-- Set default generator for subsequent inserts
ALTER TABLE public.groups
ALTER COLUMN invite_code SET DEFAULT substr(md5(random()::text || gen_random_uuid()::text), 1, 12);

ALTER TABLE public.hangouts
ALTER COLUMN invite_code SET DEFAULT substr(md5(random()::text || gen_random_uuid()::text), 1, 12);
