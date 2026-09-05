-- Migration: Add short_id to hangouts for compact, human-friendly URLs
-- Timestamp: 20260905170000

ALTER TABLE public.hangouts
ADD COLUMN IF NOT EXISTS short_id VARCHAR(16);

-- Backfill existing hangouts:
-- For unique prefixes (normal UUIDs in production), use first 8 characters.
-- For duplicate prefixes (e.g. synthetic test/seed data like c0000000-0000-...-01), disambiguate suffix.
WITH numbered AS (
    SELECT id,
           substr(id::text, 1, 8) as prefix,
           ROW_NUMBER() OVER (PARTITION BY substr(id::text, 1, 8) ORDER BY id) as rn
    FROM public.hangouts
)
UPDATE public.hangouts h
SET short_id = CASE
    WHEN n.rn = 1 THEN n.prefix
    ELSE substr(n.prefix, 1, 6) || lpad(n.rn::text, 2, '0')
END
FROM numbered n
WHERE h.id = n.id AND h.short_id IS NULL;

-- Add unique constraint safely after backfill
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'hangouts_short_id_key'
    ) THEN
        ALTER TABLE public.hangouts ADD CONSTRAINT hangouts_short_id_key UNIQUE (short_id);
    END IF;
END $$;

-- Set default generator for subsequent inserts
ALTER TABLE public.hangouts
ALTER COLUMN short_id SET DEFAULT substr(gen_random_uuid()::text, 1, 8);

-- Create index for fast lookups
CREATE INDEX IF NOT EXISTS idx_hangouts_short_id ON public.hangouts(short_id);
