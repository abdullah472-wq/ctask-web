-- ==============================================================================
-- SCHEMA UPDATE: Prevent Task Creators From Submitting/Starting Own Tasks
-- Run this script in your Supabase SQL Editor:
-- Dashboard -> SQL Editor -> New Query -> Paste & Run
-- ==============================================================================

-- 1. Create a trigger function that validates that the submitter is not the task creator
CREATE OR REPLACE FUNCTION public.check_prevent_creator_task_submission()
RETURNS trigger AS $$
DECLARE
  v_creator_id uuid;
BEGIN
  -- Look up the task creator
  SELECT creator_id INTO v_creator_id
  FROM public.tasks
  WHERE id = NEW.task_id;

  -- If the submitting user is the creator of the task, reject the operation
  IF v_creator_id IS NOT NULL AND v_creator_id = NEW.user_id THEN
    RAISE EXCEPTION 'Unauthorized: Creators cannot submit proofs for their own tasks';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Bind the trigger to task_submissions for both INSERT and UPDATE
DROP TRIGGER IF EXISTS trigger_prevent_creator_task_submission ON public.task_submissions;

CREATE TRIGGER trigger_prevent_creator_task_submission
  BEFORE INSERT OR UPDATE ON public.task_submissions
  FOR EACH ROW
  EXECUTE FUNCTION public.check_prevent_creator_task_submission();
