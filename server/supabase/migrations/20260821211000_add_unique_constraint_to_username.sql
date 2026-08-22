-- Add unique constraint and case-insensitive unique index to profiles username

ALTER TABLE "public"."profiles" ADD CONSTRAINT profiles_username_key UNIQUE (username);

CREATE UNIQUE INDEX IF NOT EXISTS profiles_username_lower_idx ON "public"."profiles" (LOWER(username));
