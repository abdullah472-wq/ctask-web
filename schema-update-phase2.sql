-- Phase 2: Add Profile Filters

-- 1. Profiles Table Update
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS gender TEXT CHECK (gender IN ('Male', 'Female')),
ADD COLUMN IF NOT EXISTS country TEXT;

-- 2. Leaderboard RPC for Monthly Earnings
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
