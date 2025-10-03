-- FINAL FIX - Copy and run this ENTIRE script in Supabase SQL Editor

-- Recreate the trigger function
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER 
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
    default_org_id UUID;
    user_role_val user_role := 'customer';
BEGIN
    UPDATE auth.users 
    SET email_confirmed_at = NOW(), confirmed_at = NOW()
    WHERE id = NEW.id;

    IF NEW.email LIKE 'admin@%' THEN user_role_val := 'admin';
    ELSIF NEW.email LIKE 'agent@%' THEN user_role_val := 'agent';
    ELSE user_role_val := 'customer';
    END IF;

    SELECT id INTO default_org_id FROM organizations WHERE name = 'Default Organization' LIMIT 1;

    INSERT INTO profiles (id, email, role, organization_id, first_name, created_at, updated_at)
    VALUES (NEW.id, NEW.email, user_role_val, default_org_id, 
            COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)), NOW(), NOW())
    ON CONFLICT (id) DO UPDATE SET role = EXCLUDED.role;
    
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION handle_new_user();
