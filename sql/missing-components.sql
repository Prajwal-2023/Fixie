-- Create the trigger function and policies that are missing
-- Run this in Supabase SQL Editor

-- Create or replace the trigger function for new user signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
    default_org_id UUID;
    user_role user_role := 'customer';
BEGIN
    -- Auto-confirm email for development (remove in production)
    UPDATE auth.users 
    SET email_confirmed_at = NOW() 
    WHERE id = NEW.id AND email_confirmed_at IS NULL;

    -- Determine role based on email pattern
    IF NEW.email LIKE '%+fixieadmin@%' THEN
        user_role := 'admin';
    ELSIF NEW.email LIKE '%+fixieagent@%' THEN
        user_role := 'agent';
    ELSE
        user_role := 'customer';
    END IF;

    -- Get or create default organization
    SELECT id INTO default_org_id FROM organizations WHERE name = 'Default Organization' LIMIT 1;
    
    IF default_org_id IS NULL THEN
        INSERT INTO organizations (name, domain) 
        VALUES ('Default Organization', 'default.com') 
        RETURNING id INTO default_org_id;
    END IF;

    -- Create profile for new user
    INSERT INTO profiles (id, email, role, organization_id)
    VALUES (NEW.id, NEW.email, user_role, default_org_id);

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop existing trigger if it exists and create new one
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Enable Row Level Security (in case it's not enabled)
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE knowledge_articles ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Create essential RLS policies
DROP POLICY IF EXISTS "Users can view their own profile" ON profiles;
CREATE POLICY "Users can view their own profile" ON profiles
    FOR SELECT USING (id = auth.uid());

DROP POLICY IF EXISTS "Users can update their own profile" ON profiles;
CREATE POLICY "Users can update their own profile" ON profiles
    FOR UPDATE USING (id = auth.uid());

COMMIT;
