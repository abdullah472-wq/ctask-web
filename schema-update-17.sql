-- schema-update-17.sql
-- Add kyc_reject_reason to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS kyc_reject_reason text;

NOTIFY pgrst, 'reload schema';
