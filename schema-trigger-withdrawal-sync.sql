-- ============================================================
-- Supabase Migration: PostgreSQL Trigger for Withdrawal & Activity Log Sync
-- Run this script in the Supabase SQL Editor
-- ============================================================

-- 1. Ensure transactions status check constraint allows 'paid' and 'rejected'
-- Note: Previously, transactions only allowed ('completed', 'pending', 'failed'),
-- which caused backend sync updates for 'paid' and 'rejected' to fail with error 23514.
ALTER TABLE public.transactions 
DROP CONSTRAINT IF EXISTS transactions_status_check;

ALTER TABLE public.transactions 
ADD CONSTRAINT transactions_status_check 
CHECK (status IN ('completed', 'pending', 'failed', 'paid', 'rejected', 'approved'));

-- 2. Ensure reference_id column and index exist on transactions
ALTER TABLE public.transactions 
ADD COLUMN IF NOT EXISTS reference_id UUID;

CREATE INDEX IF NOT EXISTS idx_transactions_reference_id 
ON public.transactions(reference_id);

-- 3. Create or replace the trigger function
CREATE OR REPLACE FUNCTION public.sync_transaction_status()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    -- Check if status has changed
    IF (NEW.status IS DISTINCT FROM OLD.status) THEN
        -- First attempt: update via direct reference_id link
        UPDATE public.transactions
        SET status = NEW.status
        WHERE reference_id = NEW.id;

        -- Fallback: if no row updated (e.g., legacy rows without reference_id),
        -- match by user_id, type = 'withdrawal', and exact amount
        IF NOT FOUND THEN
            UPDATE public.transactions
            SET status = NEW.status,
                reference_id = NEW.id
            WHERE id IN (
                SELECT id 
                FROM public.transactions
                WHERE user_id = NEW.user_id
                  AND type = 'withdrawal'
                  AND (reference_id IS NULL OR reference_id = NEW.id)
                  AND ABS(amount) = NEW.amount
                ORDER BY created_at DESC
                LIMIT 1
            );
        END IF;
    END IF;

    RETURN NEW;
END;
$$;

-- 4. Create the trigger on withdrawals table
DROP TRIGGER IF EXISTS on_withdrawal_status_change ON public.withdrawals;

CREATE TRIGGER on_withdrawal_status_change
AFTER UPDATE ON public.withdrawals
FOR EACH ROW
EXECUTE FUNCTION public.sync_transaction_status();

-- 5. Backfill & synchronize existing out-of-sync transactions immediately
UPDATE public.transactions t
SET status = w.status,
    reference_id = w.id
FROM public.withdrawals w
WHERE (
    t.reference_id = w.id 
    OR (t.reference_id IS NULL AND t.user_id = w.user_id AND ABS(t.amount) = w.amount AND t.type = 'withdrawal')
)
AND t.status IS DISTINCT FROM w.status;
