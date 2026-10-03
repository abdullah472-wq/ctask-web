-- Add avatar_id column to profiles table
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS avatar_id TEXT DEFAULT 'avatar-1';
