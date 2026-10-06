-- schema-update-16.sql
-- Add KYC columns to profiles table
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS kyc_status text DEFAULT 'unverified';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS id_type text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS id_number text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS id_front_url text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS id_back_url text;

-- Force PostgREST to reload its schema cache
NOTIFY pgrst, 'reload schema';
