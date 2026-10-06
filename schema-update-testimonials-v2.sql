-- 1. Drop the old table if it exists
DROP TABLE IF EXISTS public.testimonials;

-- 2. Create the updated testimonials table
CREATE TABLE public.testimonials (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    user_name TEXT NOT NULL,
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    review_text TEXT NOT NULL,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now())
);

-- 3. Enable RLS
ALTER TABLE public.testimonials ENABLE ROW LEVEL SECURITY;

-- 4. Create Policies

-- Anyone can read approved testimonials (for the homepage)
CREATE POLICY "Anyone can view approved testimonials" 
ON public.testimonials FOR SELECT 
USING (status = 'approved');

-- Admins can read all testimonials
CREATE POLICY "Admins can view all testimonials" 
ON public.testimonials FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
  )
);

-- Admins can update testimonials
CREATE POLICY "Admins can update testimonials" 
ON public.testimonials FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
  )
);

-- Authenticated users can insert their own testimonials
CREATE POLICY "Users can insert their own testimonials" 
ON public.testimonials FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Authenticated users can read their own testimonials (to check if already submitted)
CREATE POLICY "Users can view their own testimonials" 
ON public.testimonials FOR SELECT 
USING (auth.uid() = user_id);

-- Admins can delete testimonials
CREATE POLICY "Admins can delete testimonials" 
ON public.testimonials FOR DELETE 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
  )
);

-- 5. Insert some dummy approved reviews so the homepage isn't empty
INSERT INTO public.testimonials (user_id, user_name, rating, review_text, status)
VALUES 
  (NULL, 'Ahmed Hasan', 5, 'I have been using Ctask for 3 months now. Earning money is super easy and the withdrawal system is very fast!', 'approved'),
  (NULL, 'Sarah Rahman', 4, 'Great platform for freelancers. The premium tasks pay really well compared to other sites.', 'approved'),
  (NULL, 'Kazi Tanvir', 5, 'The best micro-tasking site in Bangladesh! Highly recommended for students wanting to earn pocket money.', 'approved');
