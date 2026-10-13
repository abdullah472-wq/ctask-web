-- ==============================================================================
-- Tier 1, Option 1: Automated Event Notifications using Supabase Database Triggers & Realtime
-- Execute this script in your Supabase SQL Editor:
-- Dashboard -> SQL Editor -> New Query -> Paste & Run
-- ==============================================================================

-- 1. Ensure notifications table exists with all required columns:
--    id (uuid), user_id (uuid), title (text), message (text), 
--    type (text: 'withdrawal' | 'task' | 'kyc' | 'system'), 
--    is_read (boolean, default false), created_at (timestamptz)
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    type TEXT NOT NULL DEFAULT 'system',
    is_read BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Ensure all columns exist if notifications table was previously created with fewer columns
ALTER TABLE public.notifications ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE;
ALTER TABLE public.notifications ADD COLUMN IF NOT EXISTS title TEXT;
ALTER TABLE public.notifications ADD COLUMN IF NOT EXISTS message TEXT;
ALTER TABLE public.notifications ADD COLUMN IF NOT EXISTS type TEXT DEFAULT 'system';
ALTER TABLE public.notifications ADD COLUMN IF NOT EXISTS is_read BOOLEAN DEFAULT false;
ALTER TABLE public.notifications ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now());

-- Update constraint for allowed notification types
ALTER TABLE public.notifications DROP CONSTRAINT IF EXISTS notifications_type_check;
ALTER TABLE public.notifications ADD CONSTRAINT notifications_type_check 
    CHECK (type IN ('withdrawal', 'task', 'kyc', 'system'));

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id_unread ON public.notifications(user_id, is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON public.notifications(created_at DESC);

-- 2. Configure Row Level Security (RLS)
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own notifications" ON public.notifications;
CREATE POLICY "Users can view own notifications" 
ON public.notifications FOR SELECT 
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own notifications" ON public.notifications;
CREATE POLICY "Users can update own notifications" 
ON public.notifications FOR UPDATE 
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins can view all notifications" ON public.notifications;
CREATE POLICY "Admins can view all notifications" 
ON public.notifications FOR SELECT 
USING ((SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin');

-- 3. Enable Supabase Realtime on public.notifications
ALTER TABLE public.notifications REPLICA IDENTITY FULL;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' 
        AND schemaname = 'public' 
        AND tablename = 'notifications'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
    END IF;
END $$;


-- ==============================================================================
-- 4. Trigger Function: Withdrawals Status Changes
-- When status updates to 'paid' or 'approved', notify payout was successful.
-- When status updates to 'rejected', notify rejection and wallet refund.
-- ==============================================================================
CREATE OR REPLACE FUNCTION public.notify_on_withdrawal_status_change()
RETURNS TRIGGER 
LANGUAGE plpgsql 
SECURITY DEFINER 
SET search_path = public
AS $$
DECLARE
    formatted_amount TEXT;
BEGIN
    IF (NEW.status IS DISTINCT FROM OLD.status) THEN
        formatted_amount := COALESCE(NEW.amount::text, '0');

        -- When status updates to 'paid' or 'approved'
        IF LOWER(NEW.status) IN ('paid', 'approved') AND LOWER(COALESCE(OLD.status, '')) NOT IN ('paid', 'approved') THEN
            INSERT INTO public.notifications (user_id, title, message, type, is_read, created_at)
            VALUES (
                NEW.user_id,
                'Payout Successful',
                'Your withdrawal request for ৳' || formatted_amount || ' has been approved and paid successfully.',
                'withdrawal',
                false,
                timezone('utc'::text, now())
            );

        -- When status updates to 'rejected'
        ELSIF LOWER(NEW.status) = 'rejected' AND LOWER(COALESCE(OLD.status, '')) <> 'rejected' THEN
            INSERT INTO public.notifications (user_id, title, message, type, is_read, created_at)
            VALUES (
                NEW.user_id,
                'Withdrawal Rejected',
                'Your withdrawal request for ৳' || formatted_amount || ' was rejected and the funds have been refunded to your wallet.',
                'withdrawal',
                false,
                timezone('utc'::text, now())
            );
        END IF;
    END IF;

    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_notify_withdrawal_status ON public.withdrawals;
CREATE TRIGGER trg_notify_withdrawal_status
AFTER UPDATE ON public.withdrawals
FOR EACH ROW
EXECUTE FUNCTION public.notify_on_withdrawal_status_change();


-- ==============================================================================
-- 5. Trigger Function: Task Submissions Status Changes
-- When status updates to 'approved', notify proof approved and reward credited.
-- When status updates to 'rejected', notify rejection.
-- ==============================================================================
CREATE OR REPLACE FUNCTION public.notify_on_task_submission_status_change()
RETURNS TRIGGER 
LANGUAGE plpgsql 
SECURITY DEFINER 
SET search_path = public
AS $$
DECLARE
    task_name TEXT;
    task_reward NUMERIC;
    reward_suffix TEXT;
BEGIN
    IF (NEW.status IS DISTINCT FROM OLD.status) THEN
        -- Query task title and reward from tasks table
        SELECT title, reward_amount 
        INTO task_name, task_reward 
        FROM public.tasks 
        WHERE id = NEW.task_id;

        IF task_name IS NULL OR task_name = '' THEN
            task_name := 'Task #' || SUBSTRING(NEW.task_id::text FROM 1 FOR 8);
        END IF;

        IF task_reward IS NOT NULL THEN
            reward_suffix := ' and ৳' || task_reward::text || ' has been credited to your wallet balance.';
        ELSE
            reward_suffix := ' and your reward has been credited.';
        END IF;

        -- When status updates to 'approved'
        IF LOWER(NEW.status) = 'approved' AND LOWER(COALESCE(OLD.status, '')) <> 'approved' THEN
            INSERT INTO public.notifications (user_id, title, message, type, is_read, created_at)
            VALUES (
                NEW.user_id,
                'Task Proof Approved',
                'Your proof submission for "' || task_name || '" was approved' || reward_suffix,
                'task',
                false,
                timezone('utc'::text, now())
            );

        -- When status updates to 'rejected'
        ELSIF LOWER(NEW.status) = 'rejected' AND LOWER(COALESCE(OLD.status, '')) <> 'rejected' THEN
            INSERT INTO public.notifications (user_id, title, message, type, is_read, created_at)
            VALUES (
                NEW.user_id,
                'Task Proof Rejected',
                'Your proof submission for "' || task_name || '" was rejected.',
                'task',
                false,
                timezone('utc'::text, now())
            );
        END IF;
    END IF;

    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_notify_task_submission_status ON public.task_submissions;
CREATE TRIGGER trg_notify_task_submission_status
AFTER UPDATE ON public.task_submissions
FOR EACH ROW
EXECUTE FUNCTION public.notify_on_task_submission_status_change();


-- ==============================================================================
-- 6. Trigger Function: KYC Status Changes on Profiles
-- When KYC status updates to 'verified' or 'approved', notify immediately.
-- When KYC status updates to 'rejected', notify rejection and details.
-- ==============================================================================
CREATE OR REPLACE FUNCTION public.notify_on_kyc_status_change()
RETURNS TRIGGER 
LANGUAGE plpgsql 
SECURITY DEFINER 
SET search_path = public
AS $$
DECLARE
    reason_note TEXT;
BEGIN
    IF (NEW.kyc_status IS DISTINCT FROM OLD.kyc_status) THEN
        -- When KYC status updates to 'verified' or 'approved'
        IF LOWER(NEW.kyc_status) IN ('verified', 'approved') AND LOWER(COALESCE(OLD.kyc_status, '')) NOT IN ('verified', 'approved') THEN
            INSERT INTO public.notifications (user_id, title, message, type, is_read, created_at)
            VALUES (
                NEW.id,
                'KYC Verification Approved',
                'Congratulations! Your identity verification (KYC) has been successfully verified and approved.',
                'kyc',
                false,
                timezone('utc'::text, now())
            );

        -- When KYC status updates to 'rejected'
        ELSIF LOWER(NEW.kyc_status) = 'rejected' AND LOWER(COALESCE(OLD.kyc_status, '')) <> 'rejected' THEN
            IF NEW.kyc_reject_reason IS NOT NULL AND TRIM(NEW.kyc_reject_reason) <> '' THEN
                reason_note := ' Reason: ' || NEW.kyc_reject_reason;
            ELSE
                reason_note := ' Your submitted documents did not meet our requirements. Please review and re-apply.';
            END IF;

            INSERT INTO public.notifications (user_id, title, message, type, is_read, created_at)
            VALUES (
                NEW.id,
                'KYC Verification Rejected',
                'Your identity verification (KYC) was rejected.' || reason_note,
                'kyc',
                false,
                timezone('utc'::text, now())
            );
        END IF;
    END IF;

    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_notify_profile_kyc_status ON public.profiles;
CREATE TRIGGER trg_notify_profile_kyc_status
AFTER UPDATE ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.notify_on_kyc_status_change();


-- ==============================================================================
-- 7. Conditional Trigger on kyc_requests table (if present in schema)
-- ==============================================================================
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name = 'kyc_requests'
    ) THEN
        EXECUTE '
            CREATE OR REPLACE FUNCTION public.notify_on_kyc_request_status_change()
            RETURNS TRIGGER 
            LANGUAGE plpgsql 
            SECURITY DEFINER 
            SET search_path = public
            AS $kyc$
            BEGIN
                IF (NEW.status IS DISTINCT FROM OLD.status) THEN
                    IF LOWER(NEW.status) IN (''verified'', ''approved'') AND LOWER(COALESCE(OLD.status, '''')) NOT IN (''verified'', ''approved'') THEN
                        INSERT INTO public.notifications (user_id, title, message, type, is_read, created_at)
                        VALUES (NEW.user_id, ''KYC Verification Approved'', ''Congratulations! Your identity verification (KYC) has been verified and approved.'', ''kyc'', false, timezone(''utc''::text, now()));
                    ELSIF LOWER(NEW.status) = ''rejected'' AND LOWER(COALESCE(OLD.status, '''')) <> ''rejected'' THEN
                        INSERT INTO public.notifications (user_id, title, message, type, is_read, created_at)
                        VALUES (NEW.user_id, ''KYC Verification Rejected'', ''Your identity verification (KYC) was rejected. Please review and submit again.'', ''kyc'', false, timezone(''utc''::text, now()));
                    END IF;
                END IF;
                RETURN NEW;
            END;
            $kyc$;

            DROP TRIGGER IF EXISTS trg_notify_kyc_request_status ON public.kyc_requests;
            CREATE TRIGGER trg_notify_kyc_request_status
            AFTER UPDATE ON public.kyc_requests
            FOR EACH ROW
            EXECUTE FUNCTION public.notify_on_kyc_request_status_change();
        ';
    END IF;
END $$;
