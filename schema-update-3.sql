-- 1. Profiles Table Additions
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS total_earned NUMERIC DEFAULT 0.00;

-- 2. Update approve_submission RPC
CREATE OR REPLACE FUNCTION approve_submission(sub_id UUID, t_id UUID, w_id UUID, reward NUMERIC)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Update the submission status
  UPDATE task_submissions 
  SET status = 'approved' 
  WHERE id = sub_id;
  
  -- Increment completed slots in tasks
  UPDATE tasks 
  SET completed_slots = completed_slots + 1 
  WHERE id = t_id;

  -- Add reward to worker's wallet AND total_earned
  UPDATE profiles 
  SET wallet_balance = wallet_balance + reward,
      total_earned = total_earned + reward
  WHERE id = w_id;
END;
$$;
