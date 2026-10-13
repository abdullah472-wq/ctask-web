-- ==============================================================================
-- Ctask Tasks & Creator Balance Migration
-- Run this in your Supabase SQL Editor (https://supabase.com/dashboard/project/_/sql)
-- ==============================================================================

-- 1. Tasks Table Additions (Bilingual columns & Reference image)
ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS title_bn TEXT;
ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS description_bn TEXT;
ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS proof_instruction_bn TEXT;
ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS reference_image_url TEXT;

-- 2. Profiles Table Additions (Deposit balance column)
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS deposit_balance NUMERIC DEFAULT 0.00;

-- 3. Function to deduct deposit balance when a user/creator creates a task
CREATE OR REPLACE FUNCTION public.deduct_deposit_for_task(user_uuid UUID, total_cost NUMERIC)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  current_balance NUMERIC;
BEGIN
  SELECT deposit_balance INTO current_balance FROM public.profiles WHERE id = user_uuid;
  
  IF current_balance IS NULL OR current_balance < total_cost THEN
    RAISE EXCEPTION 'Insufficient deposit balance';
  END IF;
  
  UPDATE public.profiles 
  SET deposit_balance = deposit_balance - total_cost 
  WHERE id = user_uuid;
END;
$$;

-- 4. Function to refund/add deposit balance when a task is rejected or cancelled
CREATE OR REPLACE FUNCTION public.add_deposit_balance(user_uuid UUID, amount NUMERIC)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.profiles 
  SET deposit_balance = COALESCE(deposit_balance, 0) + amount 
  WHERE id = user_uuid;
END;
$$;

-- 5. Grant execute permissions to public roles
GRANT EXECUTE ON FUNCTION public.deduct_deposit_for_task(UUID, NUMERIC) TO authenticated, service_role, anon;
GRANT EXECUTE ON FUNCTION public.add_deposit_balance(UUID, NUMERIC) TO authenticated, service_role, anon;

-- 6. Reload Supabase PostgREST schema cache immediately
NOTIFY pgrst, 'reload schema';
