-- Fixed trigger function for user signup
-- Copy and paste this entire script into Supabase SQL Editor

-- First, create the user_role enum if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role') THEN
        CREATE TYPE user_role AS ENUM ('admin', 'agent', 'customer');
    END IF;
END $$;

-- Create or replace the trigger function with better error handling
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
    default_org_id UUID;
    user_role_val user_role := 'customer';
BEGIN
    -- Auto-confirm email for development
    UPDATE auth.users 
    SET email_confirmed_at = NOW() 
    WHERE id = NEW.id AND email_confirmed_at IS NULL;

    -- Determine role based on email pattern
    IF NEW.email LIKE '%+fixieadmin@%' THEN
        user_role_val := 'admin';
    ELSIF NEW.email LIKE '%+fixieagent@%' THEN
        user_role_val := 'agent';
    ELSE
        user_role_val := 'customer';
    END IF;

    -- Get default organization (create if doesn't exist)
    SELECT id INTO default_org_id FROM organizations WHERE name = 'Default Organization' LIMIT 1;
    
    IF default_org_id IS NULL THEN
        INSERT INTO organizations (name, domain) 
        VALUES ('Default Organization', 'default.com') 
        RETURNING id INTO default_org_id;
    END IF;

    -- Create profile for new user
    INSERT INTO profiles (id, email, role, organization_id, first_name)
    VALUES (NEW.id, NEW.email, user_role_val, default_org_id, 
            COALESCE(NEW.raw_user_meta_data->>'full_name', 'User'));

    RETURN NEW;
EXCEPTION
    WHEN OTHERS THEN
        -- Log the error but don't fail the user creation
        RAISE LOG 'Error in handle_new_user: %', SQLERRM;
        RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop existing trigger and create new one
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Make sure organizations table exists with data
INSERT INTO organizations (name, domain) VALUES 
    ('Default Organization', 'default.com')
ON CONFLICT (name) DO NOTHING;

-- Enable RLS and create basic policies
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Drop existing policies first
DROP POLICY IF EXISTS "Users can view their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON profiles;
DROP POLICY IF EXISTS "Allow insert for new users" ON profiles;

-- Create essential policies
CREATE POLICY "Users can view their own profile" ON profiles
    FOR SELECT USING (id = auth.uid());

CREATE POLICY "Users can update their own profile" ON profiles
    FOR UPDATE USING (id = auth.uid());

CREATE POLICY "Allow insert for new users" ON profiles
    FOR INSERT WITH CHECK (id = auth.uid());

COMMIT;
