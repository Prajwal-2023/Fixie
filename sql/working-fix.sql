-- ALTERNATIVE FIX - Works without needing auth.users ownership
-- Run this entire script in Supabase SQL Editor

-- Step 1: Recreate the trigger function with explicit trigger enabling
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
    )
    ON CONFLICT (id) DO UPDATE SET
        email = EXCLUDED.email,
        role = EXCLUDED.role,
        updated_at = NOW();

    RAISE NOTICE 'Profile created successfully for user: % with role: %', NEW.email, user_role_val;
    
    RETURN NEW;
EXCEPTION
    WHEN OTHERS THEN
        RAISE LOG 'Error in handle_new_user for %: % %', NEW.email, SQLERRM, SQLSTATE;
        -- Return NEW anyway to not block user creation
        RETURN NEW;
END;
$$;

-- Step 2: Drop and recreate the trigger (this time it will be enabled by default)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW 
    EXECUTE FUNCTION handle_new_user();

-- Step 3: Create profiles for existing users without them
DO $$
DECLARE
    user_record RECORD;
    default_org_id UUID;
    user_role_val user_role;
BEGIN
    -- Get default organization
    SELECT id INTO default_org_id FROM organizations WHERE name = 'Default Organization' LIMIT 1;
    
    -- Loop through users without profiles
    FOR user_record IN 
        SELECT u.id, u.email, u.raw_user_meta_data
        FROM auth.users u
        LEFT JOIN profiles p ON u.id = p.id
        WHERE p.id IS NULL
    LOOP
        -- Determine role based on email
        IF user_record.email LIKE '%+fixieadmin@%' OR user_record.email LIKE '%admin@%' THEN
            user_role_val := 'admin';
        ELSIF user_record.email LIKE '%+fixieagent@%' OR user_record.email LIKE '%agent@%' THEN
            user_role_val := 'agent';
        ELSE
            user_role_val := 'customer';
        END IF;
        
        -- Create the missing profile
        INSERT INTO profiles (id, email, role, organization_id, first_name, created_at, updated_at)
        VALUES (
            user_record.id, 
            user_record.email, 
            user_role_val, 
            default_org_id,
            COALESCE(
                user_record.raw_user_meta_data->>'full_name',
                user_record.raw_user_meta_data->>'name',
                split_part(user_record.email, '@', 1)
            ),
            NOW(),
            NOW()
        )
        ON CONFLICT (id) DO NOTHING;
        
        RAISE NOTICE 'Created profile for: % with role: %', user_record.email, user_role_val;
    END LOOP;
END $$;

-- Step 4: Verify the setup
SELECT 
    'Setup complete!' as message,
    COUNT(DISTINCT u.id) as total_users,
    COUNT(DISTINCT p.id) as users_with_profiles
FROM auth.users u
LEFT JOIN profiles p ON u.id = p.id;

-- Step 5: Show trigger status
SELECT 
    tgname as trigger_name,
    tgenabled::text as enabled_status
FROM pg_trigger 
WHERE tgname = 'on_auth_user_created';

COMMIT;
