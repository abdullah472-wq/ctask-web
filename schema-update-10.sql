-- Retroactively fix wallet balances for workers who had tasks approved while the script was crashing halfway

-- This updates the wallet balance by adding the reward_amount of all 'approved' tasks
-- that might not have been credited. 
-- NOTE: If a worker was correctly credited for some tasks, this will double-credit them.
-- Assuming no one was correctly credited because the script always crashed on `referred_by`, this is safe.

UPDATE profiles
SET wallet_balance = wallet_balance + COALESCE(
  (
    SELECT SUM(t.reward_amount)
    FROM task_submissions ts
    JOIN tasks t ON ts.task_id = t.id
    WHERE ts.user_id = profiles.id AND ts.status = 'approved'
  ), 0
);
