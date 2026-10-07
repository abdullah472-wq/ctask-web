CREATE OR REPLACE FUNCTION public.get_global_leaderboard()
RETURNS TABLE (
    id UUID,
    full_name TEXT,
    avatar_url TEXT,
    gender TEXT,
    country TEXT,
    total_earned NUMERIC
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        p.id,
        p.full_name,
        p.avatar_url,
        p.gender,
        p.country,
        p.total_earned
    FROM 
        public.profiles p
    WHERE p.role = 'worker'
    ORDER BY 
        p.total_earned DESC
    LIMIT 10;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
