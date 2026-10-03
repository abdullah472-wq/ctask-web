-- 1. Profiles Table Updates
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS verification_status TEXT DEFAULT 'unverified',
ADD COLUMN IF NOT EXISTS nid_image_url TEXT,
ADD COLUMN IF NOT EXISTS selfie_image_url TEXT,
ADD COLUMN IF NOT EXISTS referral_code TEXT UNIQUE,
ADD COLUMN IF NOT EXISTS referred_by UUID REFERENCES profiles(id),
ADD COLUMN IF NOT EXISTS plan_type TEXT DEFAULT 'basic',
ADD COLUMN IF NOT EXISTS premium_valid_until TIMESTAMPTZ;

-- 2. Tasks Table Updates
ALTER TABLE tasks 
ADD COLUMN IF NOT EXISTS is_premium BOOLEAN DEFAULT false;

-- 3. Create Subscription Requests Table
CREATE TABLE IF NOT EXISTS subscription_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id),
  transaction_id TEXT,
  amount NUMERIC,
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS for subscription_requests
ALTER TABLE subscription_requests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can insert own subscription request" ON subscription_requests FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can view own subscription request" ON subscription_requests FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Admins can view all subscription requests" ON subscription_requests FOR SELECT USING (
  (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin'
);
CREATE POLICY "Admins can update all subscription requests" ON subscription_requests FOR UPDATE USING (
  (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin'
);

-- 4. Create Withdrawals Table
CREATE TABLE IF NOT EXISTS withdrawals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id),
  amount NUMERIC,
  method TEXT,
  account_number TEXT,
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS for withdrawals
ALTER TABLE withdrawals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can insert own withdrawals" ON withdrawals FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can view own withdrawals" ON withdrawals FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Admins can view all withdrawals" ON withdrawals FOR SELECT USING (
  (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin'
);
CREATE POLICY "Admins can update all withdrawals" ON withdrawals FOR UPDATE USING (
  (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin'
);

-- 5. RPC to handle Upgrade Approval
CREATE OR REPLACE FUNCTION approve_subscription(sub_req_id UUID, user_uuid UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Update subscription request status
  UPDATE subscription_requests SET status = 'approved' WHERE id = sub_req_id;
  
  -- Update user profile to premium with 30 days validity
  UPDATE profiles 
  SET plan_type = 'premium', 
      premium_valid_until = NOW() + INTERVAL '30 days'
  WHERE id = user_uuid;
END;
$$;
