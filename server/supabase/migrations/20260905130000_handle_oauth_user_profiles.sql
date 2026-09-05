-- Migration: Improve handle_new_user for OAuth (Google) with avatar fallback and unique username collision resolution

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
DECLARE
  base_username text;
  candidate_username text;
  username_exists boolean;
  avatar text;
BEGIN
  -- 1. Extract avatar: check avatar_url, picture (Google standard), or fall back to default
  avatar := COALESCE(
    NULLIF(TRIM(new.raw_user_meta_data->>'avatar_url'), ''),
    NULLIF(TRIM(new.raw_user_meta_data->>'picture'), ''),
    '/avatars/mika.svg'
  );

  -- 2. Determine base username
  base_username := COALESCE(
    NULLIF(TRIM(new.raw_user_meta_data->>'username'), ''),
    NULLIF(TRIM(new.raw_user_meta_data->>'preferred_username'), ''),
    NULLIF(TRIM(REGEXP_REPLACE(new.raw_user_meta_data->>'full_name', '[^a-zA-Z0-9._-]', '', 'g')), ''),
    NULLIF(TRIM(REGEXP_REPLACE(new.raw_user_meta_data->>'name', '[^a-zA-Z0-9._-]', '', 'g')), ''),
    NULLIF(TRIM(REGEXP_REPLACE(split_part(new.email, '@', 1), '[^a-zA-Z0-9._-]', '', 'g')), ''),
    'user'
  );

  candidate_username := base_username;

  -- 3. Check for uniqueness in profiles table (case-insensitive)
  SELECT EXISTS(
    SELECT 1 FROM public.profiles WHERE LOWER(username) = LOWER(candidate_username)
  ) INTO username_exists;

  -- 4. If collision found, append random 4-character hex suffix
  IF username_exists THEN
    candidate_username := base_username || '_' || substr(md5(random()::text || clock_timestamp()::text), 1, 4);
  END IF;

  -- 5. Insert profile record
  INSERT INTO public.profiles (id, email, username, avatar_url)
  VALUES (
    new.id,
    new.email,
    candidate_username,
    avatar
  )
  ON CONFLICT (id) DO NOTHING;

  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
