-- 1. Ensure the last_check_in_date column exists on the profiles table
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS last_check_in_date DATE;

-- 2. Create the claim_daily_bonus Remote Procedure Call (RPC) function
CREATE OR REPLACE FUNCTION public.claim_daily_bonus(user_uuid uuid)
RETURNS void AS $$
DECLARE
  v_last_check_in date;
BEGIN
  -- Get the current last_check_in_date
  SELECT last_check_in_date INTO v_last_check_in
  FROM public.profiles
  WHERE id = user_uuid;

  -- Check if already claimed today
  IF v_last_check_in = CURRENT_DATE THEN
    RAISE EXCEPTION 'Daily bonus already claimed today.';
  END IF;

  -- Update profile with 1.00 bonus and set check-in date
  UPDATE public.profiles
  SET 
    wallet_balance = COALESCE(wallet_balance, 0) + 1.00,
    last_check_in_date = CURRENT_DATE
  WHERE id = user_uuid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Force PostgREST to reload its schema cache so the API recognizes the function immediately
NOTIFY pgrst, 'reload schema';
