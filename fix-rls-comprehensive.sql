-- ============================================================
-- COMPREHENSIVE BUG FIX SQL
-- Run this entire script in your Supabase SQL Editor
-- ============================================================

-- ============================================================
-- 1. FIX RLS: subscription_requests - Allow users to INSERT
-- ============================================================
DROP POLICY IF EXISTS "Users can insert own subscription requests" ON subscription_requests;
CREATE POLICY "Users can insert own subscription requests"
ON subscription_requests FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Allow users to view their own
DROP POLICY IF EXISTS "Users can view own subscription requests" ON subscription_requests;
CREATE POLICY "Users can view own subscription requests"
ON subscription_requests FOR SELECT
USING (auth.uid() = user_id);

-- ============================================================
-- 2. FIX RLS: deposits - Allow users to INSERT
-- ============================================================
DROP POLICY IF EXISTS "Users can insert own deposits" ON deposits;
CREATE POLICY "Users can insert own deposits"
ON deposits FOR INSERT
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can view own deposits" ON deposits;
CREATE POLICY "Users can view own deposits"
ON deposits FOR SELECT
USING (auth.uid() = user_id);

-- ============================================================
-- 3. FIX RLS: support_tickets - Allow admins to UPDATE status
-- ============================================================
DROP POLICY IF EXISTS "Admins can update all support tickets" ON public.support_tickets;
CREATE POLICY "Admins can update all support tickets"
ON public.support_tickets FOR UPDATE
USING ((SELECT role FROM profiles WHERE id = auth.uid()) = 'admin');

-- Allow users to INSERT their own tickets
DROP POLICY IF EXISTS "Users can insert own tickets" ON public.support_tickets;
CREATE POLICY "Users can insert own tickets"
ON public.support_tickets FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- ============================================================
-- 4. Add country_code column to user_payment_methods if missing
-- ============================================================
ALTER TABLE public.user_payment_methods ADD COLUMN IF NOT EXISTS country_code TEXT DEFAULT '+880';

-- ============================================================
-- 5. Reload schema cache
-- ============================================================
NOTIFY pgrst, 'reload schema';
