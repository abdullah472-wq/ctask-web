-- ==============================================================================
-- SCHEMA MIGRATION: Site Settings Modernization & Task Lifecycle Controls
-- Execute this script in your Supabase SQL Editor:
-- Dashboard -> SQL Editor -> New Query -> Paste & Run
-- ==============================================================================

-- 1. Create or alter site_settings table
CREATE TABLE IF NOT EXISTS public.site_settings (
  id INT PRIMARY KEY DEFAULT 1,
  site_name TEXT DEFAULT 'Ctask',
  contact_email TEXT DEFAULT 'support@ctask.com',
  support_phone TEXT DEFAULT '+880 1700-000000',
  currency TEXT DEFAULT 'BDT',
  min_task_reward NUMERIC DEFAULT 1,
  max_task_reward NUMERIC DEFAULT 500,
  task_expiry_days INT DEFAULT 7,
  max_tasks_per_client INT DEFAULT 10,
  proof_requirement BOOLEAN DEFAULT true,
  slot_reservation_minutes INT DEFAULT 30,
  auto_approve_hours INT DEFAULT 48,
  auto_publish_tasks BOOLEAN DEFAULT false,
  platform_commission NUMERIC DEFAULT 10,
  min_withdrawal NUMERIC DEFAULT 50,
  withdrawal_fee NUMERIC DEFAULT 2,
  min_deposit_amount NUMERIC DEFAULT 100,
  daily_withdrawal_limit NUMERIC DEFAULT 2000,
  automatic_payout BOOLEAN DEFAULT false,
  payment_gateway TEXT DEFAULT 'bKash',
  gateway_api_key TEXT DEFAULT '',
  gateway_sandbox_mode BOOLEAN DEFAULT true,
  open_registration BOOLEAN DEFAULT true,
  require_verification BOOLEAN DEFAULT true,
  default_client_status TEXT DEFAULT 'active',
  system_notifications BOOLEAN DEFAULT true,
  two_factor_auth BOOLEAN DEFAULT false,
  maintenance_mode BOOLEAN DEFAULT false,
  maintenance_notice TEXT DEFAULT 'Platform is undergoing scheduled maintenance. Task submissions and withdrawals are temporarily paused.',
  updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now())
);

-- Ensure all columns exist if table was previously created
ALTER TABLE public.site_settings
  ADD COLUMN IF NOT EXISTS slot_reservation_minutes INT DEFAULT 30,
  ADD COLUMN IF NOT EXISTS auto_approve_hours INT DEFAULT 48,
  ADD COLUMN IF NOT EXISTS auto_publish_tasks BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS min_task_reward NUMERIC DEFAULT 1,
  ADD COLUMN IF NOT EXISTS max_task_reward NUMERIC DEFAULT 500,
  ADD COLUMN IF NOT EXISTS task_expiry_days INT DEFAULT 7,
  ADD COLUMN IF NOT EXISTS max_tasks_per_client INT DEFAULT 10,
  ADD COLUMN IF NOT EXISTS proof_requirement BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS platform_commission NUMERIC DEFAULT 10,
  ADD COLUMN IF NOT EXISTS min_withdrawal NUMERIC DEFAULT 50,
  ADD COLUMN IF NOT EXISTS withdrawal_fee NUMERIC DEFAULT 2,
  ADD COLUMN IF NOT EXISTS min_deposit_amount NUMERIC DEFAULT 100,
  ADD COLUMN IF NOT EXISTS daily_withdrawal_limit NUMERIC DEFAULT 2000,
  ADD COLUMN IF NOT EXISTS automatic_payout BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS payment_gateway TEXT DEFAULT 'bKash',
  ADD COLUMN IF NOT EXISTS gateway_api_key TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS gateway_sandbox_mode BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS open_registration BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS require_verification BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS default_client_status TEXT DEFAULT 'active',
  ADD COLUMN IF NOT EXISTS system_notifications BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS two_factor_auth BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS maintenance_mode BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS maintenance_notice TEXT DEFAULT 'Platform is undergoing scheduled maintenance. Task submissions and withdrawals are temporarily paused.';

-- 2. Insert default row if not exists
INSERT INTO public.site_settings (
  id,
  site_name,
  currency,
  slot_reservation_minutes,
  auto_approve_hours,
  auto_publish_tasks,
  platform_commission,
  min_withdrawal,
  min_deposit_amount,
  maintenance_mode
)
VALUES (
  1,
  'Ctask',
  'BDT',
  30,
  48,
  false,
  10,
  50,
  100,
  false
)
ON CONFLICT (id) DO NOTHING;

-- 3. Update auto_approve_pending_submissions to dynamically read auto_approve_hours from site_settings!
CREATE OR REPLACE FUNCTION public.auto_approve_pending_submissions()
RETURNS integer AS $$
DECLARE
  v_sub record;
  v_approved_count integer := 0;
  v_commission numeric;
  v_referrer_id uuid;
  v_auto_hours integer := 48;
BEGIN
  -- Read dynamic auto-approve hours from site_settings
  SELECT COALESCE(auto_approve_hours, 48)
  INTO v_auto_hours
  FROM public.site_settings
  WHERE id = 1;

  IF v_auto_hours IS NULL OR v_auto_hours <= 0 THEN
    v_auto_hours := 48;
  END IF;

  -- Find all submissions pending for longer than dynamic auto-approve hours
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
      AND ts.submitted_at < (timezone('utc'::text, now()) - (v_auto_hours || ' hours')::interval)
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

-- 4. RLS Configuration: Allow read to public, allow modify to admins
ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can view site settings" ON public.site_settings;
CREATE POLICY "Public can view site settings"
ON public.site_settings FOR SELECT
USING (true);

DROP POLICY IF EXISTS "Admins can update site settings" ON public.site_settings;
CREATE POLICY "Admins can update site settings"
ON public.site_settings FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
  )
);

-- 5. Enable Supabase Realtime for site_settings
ALTER TABLE public.site_settings REPLICA IDENTITY FULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' 
    AND schemaname = 'public' 
    AND tablename = 'site_settings'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.site_settings;
  END IF;
END $$;

-- 6. Reload PostgREST schema cache
NOTIFY pgrst, 'reload schema';
