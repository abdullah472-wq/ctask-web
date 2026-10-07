-- 1. Create missing columns safely
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS gender TEXT,
ADD COLUMN IF NOT EXISTS country TEXT,
ADD COLUMN IF NOT EXISTS referred_by UUID REFERENCES public.profiles(id),
ADD COLUMN IF NOT EXISTS avatar_id TEXT,
ADD COLUMN IF NOT EXISTS avatar_url TEXT,
ADD COLUMN IF NOT EXISTS default_payment_method TEXT,
ADD COLUMN IF NOT EXISTS default_payment_number TEXT;

-- 2. Update the trigger function to handle OAuth
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
    raw_name TEXT;
    extracted_avatar TEXT;
BEGIN
    raw_name := COALESCE(
        new.raw_user_meta_data->>'full_name', 
        new.raw_user_meta_data->>'name', 
        'New User'
    );
    
    extracted_avatar := COALESCE(
        new.raw_user_meta_data->>'avatar_url', 
        new.raw_user_meta_data->>'picture',
        NULL
    );

    INSERT INTO public.profiles (
        id, 
        full_name, 
        avatar_url,
        avatar_id,
        role,
        wallet_balance,
        total_earned,
        created_at
    ) 
    VALUES (
        new.id, 
        raw_name, 
        extracted_avatar,
        extracted_avatar, -- Use same for avatar_id just in case
        'worker',
        0,
        0,
        now()
    );
    
    RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Ensure trigger is active
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 3. Re-create the RPC for the Leaderboard
CREATE OR REPLACE FUNCTION get_monthly_leaderboard(
    p_gender TEXT DEFAULT NULL,
    p_country TEXT DEFAULT NULL
)
RETURNS TABLE (
    id UUID,
    full_name TEXT,
    avatar_id TEXT,
    gender TEXT,
    country TEXT,
    total_earned NUMERIC
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        p.id,
        p.full_name,
        p.avatar_id,
        p.gender,
        p.country,
        COALESCE(SUM(t.reward_amount), 0) AS total_earned
    FROM 
        public.profiles p
    JOIN 
        public.task_submissions ts ON ts.user_id = p.id
    JOIN 
        public.tasks t ON t.id = ts.task_id
    WHERE 
        ts.status = 'approved'
        AND ts.submitted_at >= date_trunc('month', CURRENT_DATE)
        AND (p_gender IS NULL OR p_gender = 'All' OR p.gender = p_gender)
        AND (p_country IS NULL OR p_country = 'All' OR p.country = p_country)
    GROUP BY 
        p.id, p.full_name, p.avatar_id, p.gender, p.country
    ORDER BY 
        total_earned DESC
    LIMIT 50;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
