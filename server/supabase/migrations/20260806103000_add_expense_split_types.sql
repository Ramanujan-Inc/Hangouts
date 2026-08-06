-- Add split_type column to expenses table ('equal' or 'personal')
ALTER TABLE expenses 
ADD COLUMN IF NOT EXISTS split_type VARCHAR(50) NOT NULL DEFAULT 'equal' CHECK (split_type IN ('equal', 'personal'));
