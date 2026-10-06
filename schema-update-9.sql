-- Add referred_by column to profiles table for referral tracking and commissions
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS referred_by UUID REFERENCES profiles(id) ON DELETE SET NULL;
