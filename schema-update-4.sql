-- 1. Profiles Table Additions
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS last_ip TEXT,
ADD COLUMN IF NOT EXISTS last_check_in_date DATE,
ADD COLUMN IF NOT EXISTS check_in_streak INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS deposit_balance NUMERIC DEFAULT 0.00,
ADD COLUMN IF NOT EXISTS is_flagged BOOLEAN DEFAULT false;

-- 2. Tasks Table Additions
ALTER TABLE tasks 
ADD COLUMN IF NOT EXISTS creator_id UUID REFERENCES profiles(id);

-- 3. Create Deposits Table
CREATE TABLE IF NOT EXISTS deposits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id),
  amount NUMERIC NOT NULL,
  payment_method TEXT NOT NULL,
  transaction_id TEXT NOT NULL,
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE deposits ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own deposits" ON deposits FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own deposits" ON deposits FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins can view all deposits" ON deposits FOR SELECT USING ( (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin' );
CREATE POLICY "Admins can update all deposits" ON deposits FOR UPDATE USING ( (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin' );

-- 4. RPC for Approving Deposits
CREATE OR REPLACE FUNCTION approve_deposit(deposit_id UUID, user_uuid UUID, amount NUMERIC)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Update deposit status
  UPDATE deposits SET status = 'approved' WHERE id = deposit_id AND status = 'pending';
  
  IF FOUND THEN
    -- Update user's deposit balance
    UPDATE profiles SET deposit_balance = deposit_balance + amount WHERE id = user_uuid;
  ELSE
    RAISE EXCEPTION 'Deposit not found or already processed';
  END IF;
END;
$$;

-- 5. RPC for Claiming Daily Bonus
CREATE OR REPLACE FUNCTION claim_daily_bonus(user_uuid UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  last_date DATE;
  streak INTEGER;
BEGIN
  SELECT last_check_in_date, check_in_streak INTO last_date, streak 
  FROM profiles WHERE id = user_uuid;

  IF last_date = CURRENT_DATE THEN
    RAISE EXCEPTION 'Already claimed today';
  END IF;

  IF last_date = CURRENT_DATE - INTERVAL '1 day' THEN
    streak := streak + 1;
  ELSE
    streak := 1;
  END IF;

  UPDATE profiles 
  SET wallet_balance = wallet_balance + 1.00,
      total_earned = total_earned + 1.00,
      last_check_in_date = CURRENT_DATE,
      check_in_streak = streak
  WHERE id = user_uuid;
END;
$$;

-- 6. RPC for Deducting Deposit Balance for Task Creation
CREATE OR REPLACE FUNCTION deduct_deposit_for_task(user_uuid UUID, total_cost NUMERIC)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  current_balance NUMERIC;
BEGIN
  SELECT deposit_balance INTO current_balance FROM profiles WHERE id = user_uuid;
  
  IF current_balance < total_cost THEN
    RAISE EXCEPTION 'Insufficient deposit balance';
  END IF;
  
  UPDATE profiles SET deposit_balance = deposit_balance - total_cost WHERE id = user_uuid;
END;
$$;
