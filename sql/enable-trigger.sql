-- ENABLE THE TRIGGER - Run this in Supabase SQL Editor
-- The trigger exists but is disabled (enabled = 0)

-- Enable the trigger
ALTER TABLE auth.users ENABLE TRIGGER on_auth_user_created;

-- Verify it's now enabled
SELECT 
    tgname as trigger_name,
    tgenabled as enabled,
    CASE tgenabled
        WHEN 'O' THEN 'ENABLED'
        WHEN 'D' THEN 'DISABLED'
        ELSE 'UNKNOWN'
    END as status
FROM pg_trigger 
WHERE tgname = 'on_auth_user_created';

-- Also, let's make sure the function has proper permissions
ALTER FUNCTION handle_new_user() OWNER TO postgres;
GRANT EXECUTE ON FUNCTION handle_new_user() TO postgres, anon, authenticated, service_role;

COMMIT;
