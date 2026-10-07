-- 1. Ensure columns exist and are NULLABLE (Adding them safely)
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS gender TEXT,
ADD COLUMN IF NOT EXISTS country TEXT,
ADD COLUMN IF NOT EXISTS referred_by UUID REFERENCES public.profiles(id);

-- 2. Update the trigger function to handle OAuth safely
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
    raw_name TEXT;
    avatar_url TEXT;
BEGIN
    -- Extract name from metadata (works for Email, Google, GitHub)
    raw_name := COALESCE(
        new.raw_user_meta_data->>'full_name', 
        new.raw_user_meta_data->>'name', 
        'New User'
    );
    
    -- Extract avatar from metadata if available (Google/GitHub)
    avatar_url := COALESCE(
        new.raw_user_meta_data->>'avatar_url', 
        new.raw_user_meta_data->>'picture',
        NULL
    );

    INSERT INTO public.profiles (
        id, 
        full_name, 
        avatar_id,
        role,
        wallet_balance,
        total_earned,
        created_at
    ) 
    VALUES (
        new.id, 
        raw_name, 
        avatar_url,
        'worker', -- Default role
        0,
        0,
        now()
    );
    
    RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Ensure the trigger is active
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
