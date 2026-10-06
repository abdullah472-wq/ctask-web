-- Step 1: Delete duplicate submissions, keeping only the most recent one per user per task
DELETE FROM task_submissions
WHERE id NOT IN (
    SELECT id
    FROM (
        SELECT id,
               ROW_NUMBER() OVER (PARTITION BY task_id, user_id ORDER BY submitted_at DESC) as row_num
        FROM task_submissions
    ) t
    WHERE t.row_num = 1
);

-- Step 2: Add UNIQUE constraint to prevent future duplicates
ALTER TABLE task_submissions
ADD CONSTRAINT unique_user_task_submission UNIQUE (task_id, user_id);
