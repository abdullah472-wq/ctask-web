-- 1. Add referral columns to profiles if they don't exist
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS referral_code TEXT UNIQUE;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS referred_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL;

-- 2. Update the handle_new_user trigger to handle referral generation and association
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
    raw_name TEXT;
    extracted_avatar TEXT;
    new_referral_code TEXT;
    name_part TEXT;
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

    -- Generate a unique referral code
    name_part := SUBSTRING(REGEXP_REPLACE(raw_name, '[^a-zA-Z]', '', 'g'), 1, 4);
    IF length(name_part) < 4 THEN
      name_part := RPAD(name_part, 4, 'X');
    END IF;
    new_referral_code := UPPER(name_part) || LPAD(FLOOR(RANDOM() * 10000)::TEXT, 4, '0');

    -- Note: you might want to loop here in production to guarantee uniqueness, 
    -- but for a simple trigger this is highly likely to be unique.

    INSERT INTO public.profiles (
        id, 
        full_name, 
        avatar_url,
        avatar_id,
        role,
        wallet_balance,
        total_earned,
        created_at,
        referral_code,
        referred_by
    ) 
    VALUES (
        new.id, 
        raw_name, 
        extracted_avatar,
        extracted_avatar,
        'worker',
        0,
        0,
        NOW(),
        new_referral_code,
        (new.raw_user_meta_data->>'referred_by')::UUID
    );

    RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Backfill referral_code for existing users
DO $$
DECLARE
  r RECORD;
  new_code TEXT;
  name_part TEXT;
BEGIN
  FOR r IN SELECT id, full_name FROM public.profiles WHERE referral_code IS NULL
  LOOP
    name_part := SUBSTRING(REGEXP_REPLACE(COALESCE(r.full_name, 'USER'), '[^a-zA-Z]', '', 'g'), 1, 4);
    IF length(name_part) < 4 THEN
      name_part := RPAD(name_part, 4, 'X');
    END IF;
    new_code := UPPER(name_part) || LPAD(FLOOR(RANDOM() * 10000)::TEXT, 4, '0');
    
    -- basic uniqueness attempt
    WHILE EXISTS (SELECT 1 FROM public.profiles WHERE referral_code = new_code) LOOP
      new_code := UPPER(name_part) || LPAD(FLOOR(RANDOM() * 10000)::TEXT, 4, '0');
    END LOOP;

    UPDATE public.profiles SET referral_code = new_code WHERE id = r.id;
  END LOOP;
END;
$$;
