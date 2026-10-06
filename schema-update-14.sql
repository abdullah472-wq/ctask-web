-- schema-update-14.sql
-- Add expires_at column to tasks table
ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS expires_at timestamp with time zone;

-- Force PostgREST to reload its schema cache so the API recognizes the new column immediately
NOTIFY pgrst, 'reload schema';
