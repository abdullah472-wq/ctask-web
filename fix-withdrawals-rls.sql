-- Run this in your Supabase SQL Editor to fix the RLS policies for the withdrawals table

-- Make sure RLS is enabled
ALTER TABLE withdrawals ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist so we can recreate them cleanly
DROP POLICY IF EXISTS "Users can insert own withdrawals" ON withdrawals;
DROP POLICY IF EXISTS "Users can view own withdrawals" ON withdrawals;
DROP POLICY IF EXISTS "Admins can view all withdrawals" ON withdrawals;
DROP POLICY IF EXISTS "Admins can update all withdrawals" ON withdrawals;

-- Recreate the policies
CREATE POLICY "Users can insert own withdrawals" 
ON withdrawals FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view own withdrawals" 
ON withdrawals FOR SELECT 
USING (auth.uid() = user_id);

-- If you have a profiles table with a 'role' column, these admin policies allow admins to manage withdrawals
CREATE POLICY "Admins can view all withdrawals" 
ON withdrawals FOR SELECT 
USING ( (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin' );

CREATE POLICY "Admins can update all withdrawals" 
ON withdrawals FOR UPDATE 
USING ( (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin' );

NOTIFY pgrst, 'reload schema';
