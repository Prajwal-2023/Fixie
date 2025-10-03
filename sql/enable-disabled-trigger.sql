-- ENABLE THE TRIGGER - Run this in Supabase SQL Editor
-- The trigger keeps getting disabled, this will enable it

-- Method 1: Enable using ALTER TABLE (requires elevated permissions)
-- If this gives permission error, use Method 2 below
ALTER TABLE auth.users ENABLE TRIGGER on_auth_user_created;

-- Check if it worked
SELECT 
    tgname, 
    tgenabled::text as enabled_code,
    CASE tgenabled::text
        WHEN 'O' THEN '✓ ENABLED'
        WHEN 'D' THEN '✗ DISABLED'
        ELSE 'UNKNOWN'
    END as status
FROM pg_trigger 
WHERE tgname = 'on_auth_user_created';

-- If Method 1 gives permission error, try Method 2:
-- Recreate the trigger (this auto-enables it)
/*
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW 
    EXECUTE FUNCTION handle_new_user();
*/
