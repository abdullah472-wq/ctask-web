-- ==============================================================================
-- Fix Row Level Security (RLS) & Permissions for Deposits Table
-- Execute this script in your Supabase SQL Editor:
-- Supabase Dashboard -> SQL Editor -> New Query -> Paste & Run
-- ==============================================================================

-- 1. Ensure deposits table and all required columns exist
CREATE TABLE IF NOT EXISTS public.deposits (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    amount NUMERIC NOT NULL,
    payment_method TEXT NOT NULL,
    transaction_id TEXT NOT NULL,
    status TEXT DEFAULT 'pending',
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now())
);

-- Ensure columns exist in case table was created with partial schema
ALTER TABLE public.deposits ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE;
ALTER TABLE public.deposits ADD COLUMN IF NOT EXISTS amount NUMERIC;
ALTER TABLE public.deposits ADD COLUMN IF NOT EXISTS payment_method TEXT;
ALTER TABLE public.deposits ADD COLUMN IF NOT EXISTS transaction_id TEXT;
ALTER TABLE public.deposits ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'pending';
ALTER TABLE public.deposits ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now());

-- Add useful indexes for performance and fast lookups
CREATE INDEX IF NOT EXISTS idx_deposits_user_id ON public.deposits(user_id);
CREATE INDEX IF NOT EXISTS idx_deposits_status ON public.deposits(status);
CREATE INDEX IF NOT EXISTS idx_deposits_transaction_id ON public.deposits(transaction_id);
CREATE INDEX IF NOT EXISTS idx_deposits_created_at ON public.deposits(created_at DESC);

-- 2. Configure Row Level Security (RLS)
ALTER TABLE public.deposits ENABLE ROW LEVEL SECURITY;

-- Clean up any existing legacy policies
DROP POLICY IF EXISTS "Users can view own deposits" ON public.deposits;
DROP POLICY IF EXISTS "Users can insert own deposits" ON public.deposits;
DROP POLICY IF EXISTS "Admins can view all deposits" ON public.deposits;
DROP POLICY IF EXISTS "Admins can update all deposits" ON public.deposits;
DROP POLICY IF EXISTS "Admins can delete deposits" ON public.deposits;
DROP POLICY IF EXISTS "Enable read access for all users" ON public.deposits;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON public.deposits;

-- Policy A: Authenticated users can view only their own deposits
CREATE POLICY "Users can view own deposits"
ON public.deposits FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Policy B: Admins can view all deposits
CREATE POLICY "Admins can view all deposits"
ON public.deposits FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
);

-- Policy C: Authenticated users can insert their own deposit requests (status must be pending)
CREATE POLICY "Users can insert own deposits"
ON public.deposits FOR INSERT
TO authenticated
WITH CHECK (
    auth.uid() = user_id
    AND (status IS NULL OR status = 'pending')
);

-- Policy D: Admins can update all deposits (approve/reject)
CREATE POLICY "Admins can update all deposits"
ON public.deposits FOR UPDATE
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
);

-- Policy E: Admins can delete deposits if necessary
CREATE POLICY "Admins can delete deposits"
ON public.deposits FOR DELETE
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
);

-- 3. Grant appropriate table permissions
GRANT SELECT, INSERT ON public.deposits TO authenticated;
GRANT ALL ON public.deposits TO service_role;

-- 4. Automated Real-Time Notification on Deposit Status Changes
-- When an admin approves or rejects a deposit, immediately push a notification to the user
CREATE OR REPLACE FUNCTION public.notify_on_deposit_status_change()
RETURNS TRIGGER 
LANGUAGE plpgsql 
SECURITY DEFINER 
SET search_path = public
AS $$
BEGIN
    IF (NEW.status IS DISTINCT FROM OLD.status) THEN
        -- Deposit Approved
        IF LOWER(NEW.status) = 'approved' AND LOWER(COALESCE(OLD.status, '')) <> 'approved' THEN
            INSERT INTO public.notifications (user_id, title, message, type, is_read, created_at)
            VALUES (
                NEW.user_id,
                'Deposit Approved',
                'Your deposit of ৳' || NEW.amount::text || ' via ' || NEW.payment_method || ' has been approved and credited to your deposit balance!',
                'system',
                false,
                timezone('utc'::text, now())
            );

        -- Deposit Rejected
        ELSIF LOWER(NEW.status) = 'rejected' AND LOWER(COALESCE(OLD.status, '')) <> 'rejected' THEN
            INSERT INTO public.notifications (user_id, title, message, type, is_read, created_at)
            VALUES (
                NEW.user_id,
                'Deposit Rejected',
                'Your deposit request of ৳' || NEW.amount::text || ' (' || NEW.payment_method || ', TxID: ' || NEW.transaction_id || ') was rejected. Please contact support if you need assistance.',
                'system',
                false,
                timezone('utc'::text, now())
            );
        END IF;
    END IF;

    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_notify_deposit_status ON public.deposits;
CREATE TRIGGER trg_notify_deposit_status
AFTER UPDATE ON public.deposits
FOR EACH ROW
EXECUTE FUNCTION public.notify_on_deposit_status_change();

-- 5. Enable Realtime on deposits table (for live UI reactivity)
ALTER TABLE public.deposits REPLICA IDENTITY FULL;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' 
        AND schemaname = 'public' 
        AND tablename = 'deposits'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.deposits;
    END IF;
END $$;

-- 6. Reload schema cache for PostgREST
NOTIFY pgrst, 'reload schema';
