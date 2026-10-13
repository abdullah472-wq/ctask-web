-- ==============================================================================
-- SCHEMA UPDATE: Fix Daily Login Streak & Check-in Sync
-- Execute this script in your Supabase SQL Editor:
-- Supabase Dashboard -> SQL Editor -> New Query -> Paste & Run
-- ==============================================================================

-- 1. Ensure current_streak and last_active_date columns exist on profiles table
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS current_streak integer DEFAULT 0;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS last_active_date date;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS last_check_in_date date;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS check_in_streak integer DEFAULT 0;

-- 2. Backfill existing streak data
UPDATE public.profiles
SET 
  current_streak = GREATEST(COALESCE(current_streak, 0), COALESCE(check_in_streak, 0)),
  last_active_date = COALESCE(last_active_date, last_check_in_date);

-- 3. Upgrade claim_daily_bonus RPC function with robust streak handling
CREATE OR REPLACE FUNCTION public.claim_daily_bonus(user_uuid uuid)
RETURNS void AS $$
DECLARE
  v_last_check_in date;
  v_streak integer;
BEGIN
  -- Get the current last_check_in_date and current_streak
  SELECT 
    COALESCE(last_check_in_date, last_active_date),
    COALESCE(current_streak, check_in_streak, 0)
  INTO v_last_check_in, v_streak
  FROM public.profiles
  WHERE id = user_uuid;

  -- Check if already claimed today
  IF v_last_check_in = CURRENT_DATE THEN
    RAISE EXCEPTION 'Daily bonus already claimed today.';
  END IF;

  -- Calculate streak
  IF v_last_check_in = CURRENT_DATE - integer '1' THEN
    v_streak := v_streak + 1;
  ELSE
    v_streak := 1;
  END IF;

  -- Update profile with 1.00 bonus, set check-in date, and update streak
  UPDATE public.profiles
  SET 
    wallet_balance = COALESCE(wallet_balance, 0) + 1.00,
    total_earned = COALESCE(total_earned, 0) + 1.00,
    last_check_in_date = CURRENT_DATE,
    last_active_date = CURRENT_DATE,
    current_streak = v_streak,
    check_in_streak = v_streak
  WHERE id = user_uuid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Reload schema cache for PostgREST
NOTIFY pgrst, 'reload schema';
