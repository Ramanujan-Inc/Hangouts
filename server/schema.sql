-- Hangouts Backend Database Schema (Consolidated reference file)
-- Last Updated: 2026-08-06

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "postgis";

-- 1. Profiles Table (Extends Supabase Auth users)
CREATE TABLE IF NOT EXISTS profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    username VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    avatar_url TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Groups Table
CREATE TABLE IF NOT EXISTS groups (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    cover_image_url TEXT,
    created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. Group Members Table (Peer-to-Peer Invite Model)
CREATE TABLE IF NOT EXISTS group_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    group_id UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    invited_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'accepted', -- 'pending', 'accepted', 'declined'
    joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT unique_group_member UNIQUE (group_id, user_id)
);

-- 4. Hangouts Table
CREATE TABLE IF NOT EXISTS hangouts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    group_id UUID REFERENCES groups(id) ON DELETE SET NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    hangout_date DATE NOT NULL,
    hangout_time TIME,
    location_name VARCHAR(255),
    latitude NUMERIC(9, 6),
    longitude NUMERIC(9, 6),
    cover_photo_url TEXT,
    created_by UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. Hangout Participants Table
CREATE TABLE IF NOT EXISTS hangout_participants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    hangout_id UUID NOT NULL REFERENCES hangouts(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    CONSTRAINT unique_hangout_participant UNIQUE (hangout_id, user_id)
);

-- 6. Media Table
CREATE TABLE IF NOT EXISTS media (
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

-- 6b. Media Favorites Junction Table
CREATE TABLE IF NOT EXISTS media_favorites (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    media_id UUID NOT NULL REFERENCES media(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT unique_media_user_favorite UNIQUE (media_id, user_id)
);

-- 7. Notes Table
CREATE TABLE IF NOT EXISTS notes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    hangout_id UUID NOT NULL REFERENCES hangouts(id) ON DELETE CASCADE,
    created_by UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    is_shared BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 8. Hangout Ratings Table
CREATE TABLE IF NOT EXISTS hangout_ratings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    hangout_id UUID NOT NULL REFERENCES hangouts(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    rating SMALLINT NOT NULL CHECK (rating >= 1 AND rating <= 5),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT unique_hangout_user_rating UNIQUE (hangout_id, user_id)
);

-- 9. Expenses Table
CREATE TABLE IF NOT EXISTS expenses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    hangout_id UUID NOT NULL REFERENCES hangouts(id) ON DELETE CASCADE,
    paid_by UUID REFERENCES profiles(id) ON DELETE CASCADE,
    description VARCHAR(255) NOT NULL,
    total_amount DECIMAL(10, 2) NOT NULL,
    split_type VARCHAR(50) NOT NULL DEFAULT 'equal' CHECK (split_type IN ('equal', 'personal')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 10. Auth User Trigger Function & Trigger
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, email, username, avatar_url)
  VALUES (
    new.id,
    new.email,
    COALESCE(new.raw_user_meta_data->>'username', split_part(new.email, '@', 1)),
    new.raw_user_meta_data->>'avatar_url'
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
