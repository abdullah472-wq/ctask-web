-- ==============================================================================
-- SCHEMA UPDATE: Task Lifecycle Automation (Slot Timer, Creator Review & Auto-Approve)
-- Execute this script in your Supabase SQL Editor:
-- Dashboard -> SQL Editor -> New Query -> Paste & Run
-- ==============================================================================

-- 1. Ensure started_at, expires_at, and submitted_at exist on task_submissions
ALTER TABLE public.task_submissions 
  ADD COLUMN IF NOT EXISTS started_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()),
  ADD COLUMN IF NOT EXISTS expires_at TIMESTAMPTZ DEFAULT (timezone('utc'::text, now()) + INTERVAL '30 minutes'),
  ADD COLUMN IF NOT EXISTS submitted_at TIMESTAMPTZ;

-- Ensure proof_image_url and proof_text allow NULL while a task is in 'in_progress' reservation
ALTER TABLE public.task_submissions ALTER COLUMN proof_image_url DROP NOT NULL;
ALTER TABLE public.task_submissions ALTER COLUMN proof_text DROP NOT NULL;

-- 2. Update status constraint to allow 'in_progress' and 'expired' if check constraint exists
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'task_submissions_status_check'
  ) THEN
    ALTER TABLE public.task_submissions DROP CONSTRAINT task_submissions_status_check;
  END IF;
END $$;

ALTER TABLE public.task_submissions 
  ADD CONSTRAINT task_submissions_status_check 
  CHECK (status IN ('in_progress', 'pending', 'approved', 'rejected', 'expired'));

-- 3. Function to clean up expired slots (abandoned after 30 minutes)
CREATE OR REPLACE FUNCTION public.cleanup_expired_task_slots()
RETURNS integer AS $$
DECLARE
  v_cleaned_count integer := 0;
BEGIN
  -- Delete in-progress reservations that expired without being submitted
  -- Deleting frees up the unique constraint so the user or other workers can reserve it again
  WITH deleted_rows AS (
    DELETE FROM public.task_submissions
    WHERE status = 'in_progress'
      AND expires_at < timezone('utc'::text, now())
    RETURNING id
  )
  SELECT count(*) INTO v_cleaned_count FROM deleted_rows;

  RETURN v_cleaned_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Function for 48-Hour Auto-Approve of pending submissions
CREATE OR REPLACE FUNCTION public.auto_approve_pending_submissions()
RETURNS integer AS $$
DECLARE
  v_sub record;
  v_approved_count integer := 0;
  v_commission numeric;
  v_referrer_id uuid;
BEGIN
  -- Find all submissions pending for longer than 48 hours
  FOR v_sub IN 
    SELECT 
      ts.id AS sub_id,
      ts.task_id,
      ts.user_id AS worker_id,
      t.reward_amount,
      p.referred_by
    FROM public.task_submissions ts
    JOIN public.tasks t ON ts.task_id = t.id
    JOIN public.profiles p ON ts.user_id = p.id
    WHERE ts.status = 'pending'
      AND ts.submitted_at < (timezone('utc'::text, now()) - INTERVAL '48 hours')
  LOOP
    -- 1. Mark submission approved
    UPDATE public.task_submissions
    SET status = 'approved'
    WHERE id = v_sub.sub_id;

    -- 2. Increment completed_slots
    UPDATE public.tasks
    SET completed_slots = COALESCE(completed_slots, 0) + 1
    WHERE id = v_sub.task_id;

    -- 3. Credit worker's wallet_balance and total_earned
    UPDATE public.profiles
    SET 
      wallet_balance = COALESCE(wallet_balance, 0) + v_sub.reward_amount,
      total_earned = COALESCE(total_earned, 0) + v_sub.reward_amount
    WHERE id = v_sub.worker_id;

    -- 4. Credit 5% referral commission if referred
    IF v_sub.referred_by IS NOT NULL THEN
      v_commission := v_sub.reward_amount * 0.05;
      UPDATE public.profiles
      SET wallet_balance = COALESCE(wallet_balance, 0) + v_commission
      WHERE id = v_sub.referred_by;
    END IF;

    v_approved_count := v_approved_count + 1;
  END LOOP;

  RETURN v_approved_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Enable Task Creators to view & review submissions for their tasks
DROP POLICY IF EXISTS "Task creators can view submissions for own tasks" ON public.task_submissions;
CREATE POLICY "Task creators can view submissions for own tasks"
ON public.task_submissions FOR SELECT
USING (
  auth.uid() = user_id 
  OR EXISTS (
    SELECT 1 FROM public.tasks t
    WHERE t.id = task_submissions.task_id
      AND t.creator_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "Task creators can update submissions for own tasks" ON public.task_submissions;
CREATE POLICY "Task creators can update submissions for own tasks"
ON public.task_submissions FOR UPDATE
USING (
  auth.uid() = user_id 
  OR EXISTS (
    SELECT 1 FROM public.tasks t
    WHERE t.id = task_submissions.task_id
      AND t.creator_id = auth.uid()
  )
);

-- 6. Reload PostgREST schema cache
NOTIFY pgrst, 'reload schema';
