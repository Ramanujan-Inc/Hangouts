-- Migration: Add Performance Indexes for Foreign Keys and Query Filters
-- Timestamp: 20260907211500

-- 1. Hangout lookup & date sorting indexes
CREATE INDEX IF NOT EXISTS idx_hangouts_created_by ON hangouts(created_by);
CREATE INDEX IF NOT EXISTS idx_hangouts_date ON hangouts(hangout_date DESC);
CREATE INDEX IF NOT EXISTS idx_hangouts_group_id ON hangouts(group_id);

-- 2. Reverse lookup for participants (Fixes composite unique index trap for user_id queries)
CREATE INDEX IF NOT EXISTS idx_hangout_participants_user_id ON hangout_participants(user_id);

-- 3. Reverse lookup for group members (Fixes get_user_groups composite index trap)
CREATE INDEX IF NOT EXISTS idx_group_members_user_status ON group_members(user_id, status);

-- 4. Detail page child tables (media, notes, expenses)
CREATE INDEX IF NOT EXISTS idx_media_hangout_id ON media(hangout_id);
CREATE INDEX IF NOT EXISTS idx_media_uploaded_by ON media(uploaded_by);
CREATE INDEX IF NOT EXISTS idx_media_favorites_user_id ON media_favorites(user_id);
CREATE INDEX IF NOT EXISTS idx_notes_hangout_id ON notes(hangout_id);
CREATE INDEX IF NOT EXISTS idx_notes_created_by ON notes(created_by);
CREATE INDEX IF NOT EXISTS idx_expenses_hangout_id ON expenses(hangout_id);
CREATE INDEX IF NOT EXISTS idx_expenses_paid_by ON expenses(paid_by);
