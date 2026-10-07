-- Create support_tickets table
CREATE TABLE IF NOT EXISTS public.support_tickets (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    subject TEXT NOT NULL,
    message TEXT NOT NULL,
    status TEXT DEFAULT 'open' CHECK (status IN ('open', 'resolved')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now())
);

-- Enable RLS
ALTER TABLE public.support_tickets ENABLE ROW LEVEL SECURITY;

-- Policies for users
CREATE POLICY "Users can view own tickets" 
ON public.support_tickets FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own tickets" 
ON public.support_tickets FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Policies for admins (using the public.is_admin() function created earlier)
CREATE POLICY "Admins can view all tickets" 
ON public.support_tickets FOR SELECT 
USING (public.is_admin());

CREATE POLICY "Admins can update tickets" 
ON public.support_tickets FOR UPDATE 
USING (public.is_admin());
