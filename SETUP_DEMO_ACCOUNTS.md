# 🎯 SIMPLE SETUP FOR DEMO ACCOUNTS

## Step 1: Run SQL in Supabase

Copy and paste this into **Supabase SQL Editor**:

```sql
-- Update trigger to handle demo emails
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
    -- Auto-confirm emails
    UPDATE auth.users 
    SET email_confirmed_at = NOW(),
        confirmed_at = NOW()
    WHERE id = NEW.id;

    -- Assign roles based on email
    IF NEW.email LIKE 'admin@%' THEN
        user_role_val := 'admin';
    ELSIF NEW.email LIKE 'agent@%' THEN
        user_role_val := 'agent';
    ELSE
        user_role_val := 'customer';
    END IF;

    -- Get org
    SELECT id INTO default_org_id 
    FROM organizations 
    WHERE name = 'Default Organization' 
    LIMIT 1;

    -- Create profile
    user_name := COALESCE(
        NEW.raw_user_meta_data->>'full_name',
        split_part(NEW.email, '@', 1)
    );

    INSERT INTO profiles (id, email, role, organization_id, first_name, created_at, updated_at)
    VALUES (NEW.id, NEW.email, user_role_val, default_org_id, user_name, NOW(), NOW())
    ON CONFLICT (id) DO UPDATE SET role = EXCLUDED.role;
    
    RETURN NEW;
END;
$$;

-- Recreate trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW 
    EXECUTE FUNCTION handle_new_user();
```

## Step 2: Create Demo Accounts

Go to your app at http://localhost:8081/ and signup these 3 accounts:

1. **Admin Account**
   - Email: `admin@fixie.demo`
   - Password: `admin123`
   - Name: `Admin User`

2. **Agent Account**
   - Email: `agent@fixie.demo`
   - Password: `agent123`
   - Name: `Agent User`

3. **Customer Account**
   - Email: `user@fixie.demo`
   - Password: `user123`
   - Name: `Customer User`

## Step 3: Test Demo Buttons

Now click the demo buttons:
- **Admin button** → Logs in as admin@fixie.demo
- **Agent button** → Logs in as agent@fixie.demo
- **User button** → Logs in as user@fixie.demo

## ✅ That's It!

The demo buttons will now work with ONE CLICK! 🚀
