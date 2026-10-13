-- ==============================================================================
-- Client Settings Migration: Notification Preferences & User Customizations
-- Execute this script in your Supabase SQL Editor:
-- Dashboard -> SQL Editor -> New Query -> Paste & Run
-- ==============================================================================

-- 1. Add notification_preferences column to profiles table if it doesn't already exist
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS notification_preferences JSONB DEFAULT '{
    "task_updates": true,
    "withdrawals": true,
    "daily_streak": true
}'::jsonb;

-- 2. Add comment for documentation
COMMENT ON COLUMN public.profiles.notification_preferences IS 'User notification preference toggles for task proofs, withdrawals, and daily streak reminders';

-- 3. Reload schema cache for PostgREST
NOTIFY pgrst, 'reload schema';
