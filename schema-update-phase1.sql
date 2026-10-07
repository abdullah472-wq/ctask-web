-- Phase 1: Database Expansion Migrations

-- 1. Profiles Table Update
-- Using ADD COLUMN IF NOT EXISTS in case any of these were partially added before.
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS referral_code TEXT UNIQUE,
ADD COLUMN IF NOT EXISTS referred_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS ip_address TEXT;

-- 2. Notifications Table
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    is_read BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS for Notifications
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own notifications" 
ON public.notifications FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can update own notifications" 
ON public.notifications FOR UPDATE 
USING (auth.uid() = user_id);


-- 3. Support Tickets Table
CREATE TABLE IF NOT EXISTS public.support_tickets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    subject TEXT NOT NULL,
    message TEXT NOT NULL,
    status TEXT DEFAULT 'open' CHECK (status IN ('open', 'resolved')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS for Support Tickets
ALTER TABLE public.support_tickets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own tickets" 
ON public.support_tickets FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create own tickets" 
ON public.support_tickets FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Depending on your admin logic, you may need additional policies for admins to view/update tickets.


-- 4. User IPs Table (Anti-Cheat)
CREATE TABLE IF NOT EXISTS public.user_ips (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    ip_address TEXT NOT NULL,
    device_info TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS for User IPs
ALTER TABLE public.user_ips ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own IPs" 
ON public.user_ips FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own IPs" 
ON public.user_ips FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Optional: Create an index for quick lookup of IP addresses during registration
CREATE INDEX IF NOT EXISTS idx_user_ips_ip_address ON public.user_ips(ip_address);
