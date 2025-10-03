-- Auto-confirm emails for development
-- Add this to your setup script if you want to keep email confirmation enabled

-- Update the user creation function to auto-confirm emails
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Auto-confirm the user's email for development
  UPDATE auth.users 
  SET email_confirmed_at = NOW()
  WHERE id = NEW.id;
  
  -- Create the profile
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
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
