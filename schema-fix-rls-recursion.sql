-- ==============================================================================
-- FIX FOR INFINITE RECURSION IN RLS POLICIES
-- Run this script in your Supabase SQL Editor
-- ==============================================================================

-- 1. Create a secure function to check for admin role.
-- By using SECURITY DEFINER, this function runs bypassing RLS, 
-- which prevents the "infinite recursion" error when querying the profiles table.
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
DECLARE
  is_admin BOOLEAN;
BEGIN
  SELECT (role = 'admin') INTO is_admin FROM public.profiles WHERE id = auth.uid();
  RETURN COALESCE(is_admin, false);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;


-- 2. Fix the profiles table RLS (assuming this is where the recursion started)
-- Drop any potentially recursive policies on profiles
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can view all profiles if admin" ON public.profiles;
DROP POLICY IF EXISTS "Profiles are viewable by everyone" ON public.profiles;

-- Create a clean SELECT policy for profiles. 
-- Usually, letting any authenticated user (or everyone) read profiles is safe and avoids recursion.
CREATE POLICY "Profiles are viewable by everyone"
ON public.profiles FOR SELECT
USING (true);


-- 3. Fix the testimonials table admin policies which threw the error
DROP POLICY IF EXISTS "Admins can view all testimonials" ON public.testimonials;
DROP POLICY IF EXISTS "Admins can update testimonials" ON public.testimonials;
DROP POLICY IF EXISTS "Admins can delete testimonials" ON public.testimonials;

CREATE POLICY "Admins can view all testimonials" 
ON public.testimonials FOR SELECT 
USING (public.is_admin());

CREATE POLICY "Admins can update testimonials" 
ON public.testimonials FOR UPDATE 
USING (public.is_admin());

CREATE POLICY "Admins can delete testimonials" 
ON public.testimonials FOR DELETE 
USING (public.is_admin());

-- (Optional) If you have other tables like deposits, withdrawals, etc.
-- you can start replacing `(SELECT role FROM profiles WHERE id = auth.uid()) = 'admin'` 
-- with `public.is_admin()` to make them faster and safer!
