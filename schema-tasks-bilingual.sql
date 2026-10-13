-- Migration: Add bilingual Bengali columns and reference image to tasks table
-- Run this in Supabase SQL Editor (https://supabase.com/dashboard/project/_/sql)

ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS title_bn TEXT;
ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS description_bn TEXT;
ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS proof_instruction_bn TEXT;
ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS reference_image_url TEXT;

-- Reload Supabase PostgREST schema cache immediately
NOTIFY pgrst, 'reload schema';
