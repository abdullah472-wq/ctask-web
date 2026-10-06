-- Add total_earned column to profiles to track all-time earnings for the leaderboard
ALTER TABLE public.profiles ADD COLUMN if not exists total_earned numeric DEFAULT 0;

-- Retroactively populate total_earned with past approved tasks (optional but recommended)
UPDATE public.profiles p
SET total_earned = COALESCE(
  (
    SELECT SUM(t.reward_amount)
    FROM task_submissions ts
    JOIN tasks t ON ts.task_id = t.id
    WHERE ts.user_id = p.id AND ts.status = 'approved'
  ), 0
);
