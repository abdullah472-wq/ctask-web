-- 1. Add current_streak column to profiles table
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS current_streak integer DEFAULT 0;

-- 2. Update claim_daily_bonus function to handle streak logic
CREATE OR REPLACE FUNCTION public.claim_daily_bonus(user_uuid uuid)
RETURNS void AS $$
DECLARE
  v_last_check_in date;
  v_current_streak integer;
BEGIN
  -- Get the current last_check_in_date and current_streak
  SELECT last_check_in_date, COALESCE(current_streak, 0) 
  INTO v_last_check_in, v_current_streak
  FROM public.profiles
  WHERE id = user_uuid;

  -- Check if already claimed today
  IF v_last_check_in = CURRENT_DATE THEN
    RAISE EXCEPTION 'Daily bonus already claimed today.';
  END IF;

  -- Calculate streak
  -- If they claimed exactly yesterday, increment streak
  IF v_last_check_in = CURRENT_DATE - integer '1' THEN
    v_current_streak := v_current_streak + 1;
  ELSE
    -- If it's their first time, or they missed a day, reset streak to 1
    v_current_streak := 1;
  END IF;

  -- Update profile with 1.00 bonus, set check-in date, and update streak
  UPDATE public.profiles
  SET 
    wallet_balance = COALESCE(wallet_balance, 0) + 1.00,
    last_check_in_date = CURRENT_DATE,
    current_streak = v_current_streak
  WHERE id = user_uuid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Reload schema cache for PostgREST
NOTIFY pgrst, 'reload schema';
