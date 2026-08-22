-- Update group_members table to support peer-to-peer invite model

-- Add invited_by column referencing profiles
ALTER TABLE group_members 
ADD COLUMN IF NOT EXISTS invited_by UUID REFERENCES profiles(id) ON DELETE SET NULL;

-- Add status column (pending, accepted, declined)
ALTER TABLE group_members 
ADD COLUMN IF NOT EXISTS status VARCHAR(50) NOT NULL DEFAULT 'accepted';

-- Drop role column and enum type if exists
ALTER TABLE group_members 
DROP COLUMN IF EXISTS role;

DROP TYPE IF EXISTS group_role;
