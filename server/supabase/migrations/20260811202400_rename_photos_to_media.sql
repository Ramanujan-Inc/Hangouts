-- Rename photos table to media and add media_type and favorite columns

DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'photos') THEN
        ALTER TABLE "public"."photos" RENAME TO "media";
    END IF;
END $$;

CREATE TABLE IF NOT EXISTS "public"."media" (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    hangout_id UUID NOT NULL REFERENCES hangouts(id) ON DELETE CASCADE,
    uploaded_by UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    url TEXT NOT NULL,
    thumbnail_url TEXT NOT NULL,
    caption VARCHAR(500),
    media_type VARCHAR(20) NOT NULL DEFAULT 'photo' CHECK (media_type IN ('photo', 'video')),
    favorites_count INTEGER NOT NULL DEFAULT 0,
    is_shared BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE "public"."media" ADD COLUMN IF NOT EXISTS media_type VARCHAR(20) NOT NULL DEFAULT 'photo' CHECK (media_type IN ('photo', 'video'));
ALTER TABLE "public"."media" ADD COLUMN IF NOT EXISTS favorites_count INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "public"."media" DROP COLUMN IF EXISTS is_favorite;

ALTER TABLE "public"."media" ENABLE ROW LEVEL SECURITY;

GRANT ALL ON TABLE "public"."media" TO "anon";
GRANT ALL ON TABLE "public"."media" TO "authenticated";
GRANT ALL ON TABLE "public"."media" TO "service_role";
