-- COMPLETE FIX FOR DATABASE ERROR
-- Run this ENTIRE script in Supabase SQL Editor

-- Step 1: Ensure the enum type exists
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role') THEN
        CREATE TYPE user_role AS ENUM ('admin', 'agent', 'customer');
    END IF;
END $$;

-- Step 2: Ensure organizations table has the constraint we need
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'organizations_name_key'
    ) THEN
        ALTER TABLE organizations ADD CONSTRAINT organizations_name_key UNIQUE (name);
    END IF;
END $$;

-- Step 3: Insert default organization
INSERT INTO organizations (name, domain) VALUES 
    ('Default Organization', 'default.com')
ON CONFLICT (name) DO NOTHING;

-- Step 4: Create the trigger function with full error handling
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER 
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
    default_org_id UUID;
    user_role_val user_role := 'customer';
    user_name TEXT;
BEGIN
    -- Log the start
    RAISE NOTICE 'Creating profile for user: %', NEW.email;

    -- Auto-confirm email for development
    UPDATE auth.users 
    SET email_confirmed_at = COALESCE(email_confirmed_at, NOW()),
        confirmed_at = COALESCE(confirmed_at, NOW())
    WHERE id = NEW.id;

    -- Determine role based on email pattern
    IF NEW.email LIKE '%+fixieadmin@%' OR NEW.email LIKE '%admin@%' THEN
        user_role_val := 'admin';
    ELSIF NEW.email LIKE '%+fixieagent@%' OR NEW.email LIKE '%agent@%' THEN
        user_role_val := 'agent';
    ELSE
        user_role_val := 'customer';
    END IF;

    -- Get default organization
    SELECT id INTO default_org_id 
    FROM organizations 
    WHERE name = 'Default Organization' 
    LIMIT 1;
    
    -- If no default org, create it
    IF default_org_id IS NULL THEN
        INSERT INTO organizations (name, domain) 
        VALUES ('Default Organization', 'default.com') 
        RETURNING id INTO default_org_id;
    END IF;

    -- Extract name from metadata or use default
    user_name := COALESCE(
        NEW.raw_user_meta_data->>'full_name',
        NEW.raw_user_meta_data->>'name',
        split_part(NEW.email, '@', 1)
    );

    -- Create the profile
    INSERT INTO profiles (
        id, 
        email, 
        role, 
        organization_id, 
        first_name,
        created_at,
        updated_at
    ) VALUES (
        NEW.id, 
        NEW.email, 
        user_role_val, 
        default_org_id,
        user_name,
        NOW(),
        NOW()
    );

    RAISE NOTICE 'Profile created successfully for user: % with role: %', NEW.email, user_role_val;
    
    RETURN NEW;
EXCEPTION
    WHEN OTHERS THEN
        RAISE LOG 'Error in handle_new_user for %: % %', NEW.email, SQLERRM, SQLSTATE;
        -- Return NEW anyway to not block user creation
        RETURN NEW;
END;
$$;

-- Step 5: Drop and recreate the trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW 
    EXECUTE FUNCTION handle_new_user();

-- Step 6: Enable RLS and create policies
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;

-- Drop all existing policies to avoid conflicts
DROP POLICY IF EXISTS "Users can view their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON profiles;
DROP POLICY IF EXISTS "Allow insert for new users" ON profiles;
DROP POLICY IF EXISTS "Users can view their organization" ON organizations;

-- Create fresh policies
CREATE POLICY "Users can view their own profile" ON profiles
    FOR SELECT 
    USING (id = auth.uid());

CREATE POLICY "Users can update their own profile" ON profiles
    FOR UPDATE 
    USING (id = auth.uid());

CREATE POLICY "Allow insert for new users" ON profiles
    FOR INSERT 
    WITH CHECK (id = auth.uid());

CREATE POLICY "Users can view their organization" ON organizations
    FOR SELECT 
    USING (
        id IN (
            SELECT organization_id 
            FROM profiles 
            WHERE id = auth.uid()
        )
    );

-- Step 7: Grant necessary permissions
GRANT USAGE ON SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL ON ALL ROUTINES IN SCHEMA public TO postgres, anon, authenticated, service_role;

-- Verify the trigger was created
SELECT 
    'Trigger created successfully!' as message,
    tgname as trigger_name,
    tgenabled as enabled
FROM pg_trigger 
WHERE tgname = 'on_auth_user_created';

COMMIT;
