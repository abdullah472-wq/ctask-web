-- Run this in your Supabase SQL Editor to fix the missing columns and reload the schema cache

ALTER TABLE withdrawals ADD COLUMN IF NOT EXISTS method TEXT;
ALTER TABLE withdrawals ADD COLUMN IF NOT EXISTS account_number TEXT;

-- This command forces the API to refresh its cached schema so it recognizes the new columns immediately
NOTIFY pgrst, 'reload schema';
