-- Supabase Native Seed SQL
-- This file is automatically executed by `supabase db reset` or `supabase start`

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================================
-- 1. SEED AUTH USERS & PROFILES
-- ============================================================================
-- Password for all seed users: Password123!

INSERT INTO auth.users (
    instance_id,
    id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
    raw_app_meta_data,
    raw_user_meta_data,
    created_at,
    updated_at,
    confirmation_token,
    email_change,
    email_change_token_new,
    recovery_token
) VALUES
(
    '00000000-0000-0000-0000-000000000000',
    'a0000000-0000-0000-0000-000000000001',
    'authenticated',
    'authenticated',
    'mika@hangouts.dev',
    crypt('Password123!', gen_salt('bf')),
    NOW(),
    '{"provider": "email", "providers": ["email"]}',
    '{"username": "Mika", "avatar_url": "https://api.dicebear.com/7.x/adventurer/svg?seed=mika"}',
    NOW(),
    NOW(),
    '',
    '',
    '',
    ''
),
(
    '00000000-0000-0000-0000-000000000000',
    'a0000000-0000-0000-0000-000000000002',
    'authenticated',
    'authenticated',
    'jam@hangouts.dev',
    crypt('Password123!', gen_salt('bf')),
    NOW(),
    '{"provider": "email", "providers": ["email"]}',
    '{"username": "Jam", "avatar_url": "https://api.dicebear.com/7.x/adventurer/svg?seed=jam"}',
    NOW(),
    NOW(),
    '',
    '',
    '',
    ''
),
(
    '00000000-0000-0000-0000-000000000000',
    'a0000000-0000-0000-0000-000000000003',
    'authenticated',
    'authenticated',
    'dave@hangouts.dev',
    crypt('Password123!', gen_salt('bf')),
    NOW(),
    '{"provider": "email", "providers": ["email"]}',
    '{"username": "Dave", "avatar_url": "https://api.dicebear.com/7.x/adventurer/svg?seed=dave"}',
    NOW(),
    NOW(),
    '',
    '',
    '',
    ''
),
(
    '00000000-0000-0000-0000-000000000000',
    'a0000000-0000-0000-0000-000000000004',
    'authenticated',
    'authenticated',
    'chloe@hangouts.dev',
    crypt('Password123!', gen_salt('bf')),
    NOW(),
    '{"provider": "email", "providers": ["email"]}',
    '{"username": "Chloe", "avatar_url": "https://api.dicebear.com/7.x/adventurer/svg?seed=chloe"}',
    NOW(),
    NOW(),
    '',
    '',
    '',
    ''
)
ON CONFLICT (id) DO NOTHING;

-- Upsert profiles to guarantee username and avatar_url synchronization
INSERT INTO public.profiles (id, email, username, avatar_url) VALUES
('a0000000-0000-0000-0000-000000000001', 'mika@hangouts.dev', 'Mika', 'https://api.dicebear.com/7.x/adventurer/svg?seed=mika'),
('a0000000-0000-0000-0000-000000000002', 'jam@hangouts.dev', 'Jam', 'https://api.dicebear.com/7.x/adventurer/svg?seed=jam'),
('a0000000-0000-0000-0000-000000000003', 'dave@hangouts.dev', 'Dave', 'https://api.dicebear.com/7.x/adventurer/svg?seed=dave'),
('a0000000-0000-0000-0000-000000000004', 'chloe@hangouts.dev', 'Chloe', 'https://api.dicebear.com/7.x/adventurer/svg?seed=chloe')
ON CONFLICT (id) DO UPDATE SET
    username = EXCLUDED.username,
    avatar_url = EXCLUDED.avatar_url;

-- ============================================================================
-- 2. SEED GROUPS & MEMBERS
-- ============================================================================
INSERT INTO public.groups (id, name, cover_image_url, created_by) VALUES
('b0000000-0000-0000-0000-000000000001', 'Weekend Warriors', 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1200&q=80', 'a0000000-0000-0000-0000-000000000001'),
('b0000000-0000-0000-0000-000000000002', 'Foodies Club', 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=1200&q=80', 'a0000000-0000-0000-0000-000000000002')
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.group_members (group_id, user_id, status) VALUES
-- Weekend Warriors
('b0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', 'accepted'),
('b0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000002', 'accepted'),
('b0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000003', 'accepted'),
('b0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000004', 'accepted'),
-- Foodies Club
('b0000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000002', 'accepted'),
('b0000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000001', 'accepted'),
('b0000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000003', 'accepted')
ON CONFLICT (group_id, user_id) DO NOTHING;

-- ============================================================================
-- 3. SEED HANGOUTS
-- ============================================================================
INSERT INTO public.hangouts (id, title, description, hangout_date, hangout_time, location_name, formatted_address, place_id, latitude, longitude, cover_photo_url, group_id, created_by) VALUES
(
    'c0000000-0000-0000-0000-000000000001',
    'Friday Night Ramen',
    'Craving spicy tonkotsu ramen after a long week. Ended up talking for hours about trip planning and old college memories. We ordered the special Gyoza too!',
    '2025-07-29',
    '19:00:00',
    'Ramen Nagi, BGC',
    'Bonifacio High Street Central, Taguig, 1634 Metro Manila',
    NULL,
    14.5507,
    121.0465,
    'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?auto=format&fit=crop&w=1200&q=80',
    'b0000000-0000-0000-0000-000000000002',
    'a0000000-0000-0000-0000-000000000001'
),
(
    'c0000000-0000-0000-0000-000000000002',
    'Beach Day Picnic',
    'Road trip to the beach! Super clear waters and awesome music.',
    '2026-07-15',
    '08:00:00',
    'Anawangin Cove',
    'San Antonio, Zambales, Philippines',
    NULL,
    14.8864,
    120.0617,
    'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1200&q=80',
    'b0000000-0000-0000-0000-000000000001',
    'a0000000-0000-0000-0000-000000000001'
),
(
    'c0000000-0000-0000-0000-000000000003',
    'Coffee & Boardgames',
    'Relaxing afternoon cafe session playing strategic boardgames.',
    '2026-07-26',
    '14:30:00',
    'Wildflour Cafe + Bakery',
    'Net Lima Building, 4th Ave, BGC, Taguig, Metro Manila',
    NULL,
    14.5515,
    121.0494,
    'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&w=1200&q=80',
    NULL,
    'a0000000-0000-0000-0000-000000000003'
),
(
    'c0000000-0000-0000-0000-000000000004',
    'Sunset Walk in Old Manila',
    'Exploring historic cobblestone streets and catching the Manila Bay golden hour.',
    '2024-08-21',
    '17:00:00',
    'Intramuros Historic District',
    'Intramuros, Manila, 1002 Metro Manila',
    NULL,
    14.5896,
    120.9747,
    'https://images.unsplash.com/photo-1514933651103-005eec06c04b?auto=format&fit=crop&w=1200&q=80',
    'b0000000-0000-0000-0000-000000000001',
    'a0000000-0000-0000-0000-000000000001'
)
ON CONFLICT (id) DO NOTHING;

-- Participants
INSERT INTO public.hangout_participants (hangout_id, user_id) VALUES
-- Friday Night Ramen
('c0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001'),
('c0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000002'),
('c0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000003'),
-- Beach Day Picnic
('c0000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000001'),
('c0000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000002'),
('c0000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000003'),
('c0000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000004'),
-- Coffee & Boardgames
('c0000000-0000-0000-0000-000000000003', 'a0000000-0000-0000-0000-000000000003'),
('c0000000-0000-0000-0000-000000000003', 'a0000000-0000-0000-0000-000000000001'),
-- Sunset Walk in Old Manila
('c0000000-0000-0000-0000-000000000004', 'a0000000-0000-0000-0000-000000000001'),
('c0000000-0000-0000-0000-000000000004', 'a0000000-0000-0000-0000-000000000002'),
('c0000000-0000-0000-0000-000000000004', 'a0000000-0000-0000-0000-000000000003'),
('c0000000-0000-0000-0000-000000000004', 'a0000000-0000-0000-0000-000000000004')
ON CONFLICT (hangout_id, user_id) DO NOTHING;

-- Ratings
INSERT INTO public.hangout_ratings (hangout_id, user_id, rating) VALUES
('c0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', 5),
('c0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000002', 4),
('c0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000003', 4),
('c0000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000001', 5),
('c0000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000004', 5)
ON CONFLICT (hangout_id, user_id) DO NOTHING;

-- ============================================================================
-- 4. SEED NOTES
-- ============================================================================
INSERT INTO public.notes (id, hangout_id, created_by, content, is_shared) VALUES
('d0000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', 'Jam ate 3 bowls of noodles! Certified black hole stomach.', TRUE),
('d0000000-0000-0000-0000-000000000002', 'c0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000003', 'Note to self: The Red King ramen at Level 3 spice is actually spicy. Bring milk next time.', TRUE),
('d0000000-0000-0000-0000-000000000003', 'c0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000002', 'Next meetup should be at the beach! Let’s plan for next month.', TRUE),
('d0000000-0000-0000-0000-000000000004', 'c0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', 'Don''t forget to ask Jam for the camera lens borrow.', FALSE),
('d0000000-0000-0000-0000-000000000005', 'c0000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000004', 'Bring high SPF sunscreen, snacks, and extra beach towels!', TRUE),
('d0000000-0000-0000-0000-000000000006', 'c0000000-0000-0000-0000-000000000003', 'a0000000-0000-0000-0000-000000000003', 'Catan rematch scheduled for next Sunday.', TRUE),
('d0000000-0000-0000-0000-000000000007', 'c0000000-0000-0000-0000-000000000004', 'a0000000-0000-0000-0000-000000000001', 'Best sunset view from Fort Santiago walls!', TRUE)
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- 5. SEED MEDIA GALLERY
-- ============================================================================
INSERT INTO public.media (id, hangout_id, uploaded_by, url, thumbnail_url, caption, media_type, is_shared) VALUES
(
    'e0000000-0000-0000-0000-000000000001',
    'c0000000-0000-0000-0000-000000000001',
    'a0000000-0000-0000-0000-000000000001',
    'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?auto=format&fit=crop&w=600&q=80',
    'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?auto=format&fit=crop&w=600&q=80',
    'Ramen Feast',
    'photo',
    TRUE
),
(
    'e0000000-0000-0000-0000-000000000002',
    'c0000000-0000-0000-0000-000000000001',
    'a0000000-0000-0000-0000-000000000002',
    'https://images.unsplash.com/photo-1557872943-16a5ac26437e?auto=format&fit=crop&w=600&q=80',
    'https://images.unsplash.com/photo-1557872943-16a5ac26437e?auto=format&fit=crop&w=600&q=80',
    'Gyoza side dish',
    'photo',
    TRUE
),
(
    'e0000000-0000-0000-0000-000000000003',
    'c0000000-0000-0000-0000-000000000001',
    'a0000000-0000-0000-0000-000000000003',
    'https://assets.mixkit.co/videos/preview/mixkit-chef-preparing-ramen-soup-42867-large.mp4',
    'https://images.unsplash.com/photo-1585032226651-759b368d7246?auto=format&fit=crop&w=600&q=80',
    'Chef in action',
    'video',
    TRUE
),
(
    'e0000000-0000-0000-0000-000000000004',
    'c0000000-0000-0000-0000-000000000001',
    'a0000000-0000-0000-0000-000000000001',
    'https://images.unsplash.com/photo-1534422298391-e4f8c172dddb?auto=format&fit=crop&w=600&q=80',
    'https://images.unsplash.com/photo-1534422298391-e4f8c172dddb?auto=format&fit=crop&w=600&q=80',
    'Late night noodles',
    'photo',
    TRUE
),
(
    'e0000000-0000-0000-0000-000000000005',
    'c0000000-0000-0000-0000-000000000002',
    'a0000000-0000-0000-0000-000000000004',
    'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=600&q=80',
    'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=600&q=80',
    'Pristine beach waters',
    'photo',
    TRUE
),
(
    'e0000000-0000-0000-0000-000000000006',
    'c0000000-0000-0000-0000-000000000004',
    'a0000000-0000-0000-0000-000000000001',
    'https://images.unsplash.com/photo-1514933651103-005eec06c04b?auto=format&fit=crop&w=600&q=80',
    'https://images.unsplash.com/photo-1514933651103-005eec06c04b?auto=format&fit=crop&w=600&q=80',
    'Historic Street Lanterns',
    'photo',
    TRUE
)
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- 6. SEED EXPENSES
-- ============================================================================
INSERT INTO public.expenses (id, hangout_id, paid_by, description, total_amount, split_type) VALUES
('f0000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', 'Ramen Bowls & Gyoza', 1800.00, 'equal'),
('f0000000-0000-0000-0000-000000000002', 'c0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000002', 'Dessert & Milk tea', 450.00, 'equal'),
('f0000000-0000-0000-0000-000000000003', 'c0000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000001', 'Van Rental & Tolls', 3200.00, 'equal'),
('f0000000-0000-0000-0000-000000000004', 'c0000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000003', 'Grill & Seafood Lunch', 1600.00, 'equal'),
('f0000000-0000-0000-0000-000000000005', 'c0000000-0000-0000-0000-000000000003', 'a0000000-0000-0000-0000-000000000003', 'Specialty Brews & Pastries', 850.00, 'equal'),
('f0000000-0000-0000-0000-000000000006', 'c0000000-0000-0000-0000-000000000004', 'a0000000-0000-0000-0000-000000000002', 'Entrance Tickets & Street Food', 600.00, 'equal')
ON CONFLICT (id) DO NOTHING;
