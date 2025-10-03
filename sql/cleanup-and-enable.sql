-- CLEANUP AND FIX - Run this entire script in Supabase SQL Editor

-- Step 1: Enable the trigger (it's currently disabled!)
ALTER TABLE auth.users ENABLE TRIGGER on_auth_user_created;

-- Step 2: Clean up any users that don't have profiles
-- First, let's see if there are any orphaned users
SELECT 
    u.id,
    u.email,
    u.created_at,
    CASE WHEN p.id IS NULL THEN 'NO PROFILE' ELSE 'HAS PROFILE' END as profile_status
FROM auth.users u
LEFT JOIN profiles p ON u.id = p.id
ORDER BY u.created_at DESC;

-- Step 3: Create profiles for any users that don't have them
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
        SELECT u.id, u.email
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
        INSERT INTO profiles (id, email, role, organization_id, first_name)
        VALUES (
            user_record.id, 
            user_record.email, 
            user_role_val, 
            default_org_id,
            split_part(user_record.email, '@', 1)
        )
        ON CONFLICT (id) DO NOTHING;
        
        RAISE NOTICE 'Created profile for: % with role: %', user_record.email, user_role_val;
    END LOOP;
END $$;

-- Step 4: Verify trigger is enabled
SELECT 
    tgname as trigger_name,
    tgenabled as enabled_code,
    CASE tgenabled
        WHEN 'O' THEN '✓ ENABLED'
        WHEN 'D' THEN '✗ DISABLED'
        ELSE 'UNKNOWN'
    END as status
FROM pg_trigger 
WHERE tgname = 'on_auth_user_created';

-- Step 5: Check all users now have profiles
SELECT 
    COUNT(*) as total_users,
    COUNT(p.id) as users_with_profiles,
    COUNT(*) - COUNT(p.id) as users_without_profiles
FROM auth.users u
LEFT JOIN profiles p ON u.id = p.id;

COMMIT;
