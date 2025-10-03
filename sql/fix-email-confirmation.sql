-- UPDATE EXISTING SETUP - Run this to fix the email confirmation issue
-- This updates the existing trigger without conflicts

-- 1. Drop and recreate the trigger function with auto-confirm
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

-- 2. Create updated function with auto email confirmation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Auto-confirm the user's email for development (THIS FIXES THE EMAIL ISSUE)
  UPDATE auth.users 
  SET email_confirmed_at = NOW()
  WHERE id = NEW.id;
  
  -- Create the profile with your email patterns
  INSERT INTO public.profiles (id, email, name, role, organization_id)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    CASE 
      -- YOUR SPECIFIC EMAILS get respective roles
      WHEN NEW.email = 'prajwal.mac2025+fixieadmin@gmail.com' THEN 'admin'
      WHEN NEW.email = 'prajwal.mac2025+fixieagent@gmail.com' THEN 'agent'
      -- Pattern for admin-created accounts: anything+admin@ gets admin role
      WHEN NEW.email LIKE '%+admin@%' THEN 'admin'
      -- Pattern for agent accounts: anything+agent@ gets agent role  
      WHEN NEW.email LIKE '%+agent@%' THEN 'agent'
      -- Everyone else gets user role
      ELSE 'user'
    END,
    '00000000-0000-0000-0000-000000000001'
  )
  ON CONFLICT (id) DO UPDATE SET
    role = EXCLUDED.role,
    updated_at = NOW();
    
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Recreate the trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 4. Auto-confirm any existing unconfirmed users
UPDATE auth.users 
SET email_confirmed_at = NOW() 
WHERE email_confirmed_at IS NULL;

-- ✅ Email confirmation issue fixed!
SELECT 'Email confirmation fixed! You can now create accounts without email confirmation errors.' as status;
