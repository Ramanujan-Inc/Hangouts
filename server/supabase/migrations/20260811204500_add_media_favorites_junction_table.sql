-- Create media_favorites junction table to track user-specific media favorites

CREATE TABLE IF NOT EXISTS "public"."media_favorites" (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    media_id UUID NOT NULL REFERENCES "public"."media"(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES "public"."profiles"(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT unique_media_user_favorite UNIQUE (media_id, user_id)
);

ALTER TABLE "public"."media_favorites" ENABLE ROW LEVEL SECURITY;

GRANT ALL ON TABLE "public"."media_favorites" TO "anon";
GRANT ALL ON TABLE "public"."media_favorites" TO "authenticated";
GRANT ALL ON TABLE "public"."media_favorites" TO "service_role";
