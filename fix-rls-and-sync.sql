-- ============================================================
-- FIX 1: RLS Policy for subscription_requests
-- Run this in the Supabase SQL Editor
-- ============================================================

-- Allow authenticated users to insert their own subscription requests
CREATE POLICY "Allow authenticated users to insert subscription requests" 
ON public.subscription_requests 
FOR INSERT 
TO authenticated 
WITH CHECK (auth.uid() = user_id);

-- Allow users to view their own subscription requests
CREATE POLICY "Allow users to view own subscription requests"
ON public.subscription_requests
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);


-- ============================================================
-- FIX 2: Add reference_id column to transactions (if missing)
-- Skip this block if the column already exists
-- ============================================================

ALTER TABLE public.transactions 
ADD COLUMN IF NOT EXISTS reference_id UUID;

-- Index for faster lookups when syncing withdrawal status
CREATE INDEX IF NOT EXISTS idx_transactions_reference_id 
ON public.transactions(reference_id);


-- ============================================================
-- FIX 3: Backfill reference_id for existing withdrawal rows
-- This links existing pending transactions to their withdrawals
-- by matching user_id + amount + type
-- ============================================================

UPDATE public.transactions t
SET reference_id = w.id
FROM public.withdrawals w
WHERE t.reference_id IS NULL
  AND t.type = 'withdrawal'
  AND t.user_id = w.user_id
  AND ABS(t.amount) = w.amount;
