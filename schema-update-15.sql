-- schema-update-15.sql
-- Add default payment settings to profiles table
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS default_payment_method text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS default_payment_number text;

-- Force PostgREST to reload its schema cache
NOTIFY pgrst, 'reload schema';
