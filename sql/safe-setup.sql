-- Clean setup for fresh Supabase project with enterprise authentication
-- This script handles existing objects and creates the full schema safely

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create user_role type if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role') THEN
        CREATE TYPE user_role AS ENUM ('admin', 'agent', 'customer');
    END IF;
END $$;

-- Create ticket_status type if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'ticket_status') THEN
        CREATE TYPE ticket_status AS ENUM ('open', 'in_progress', 'resolved', 'closed');
    END IF;
END $$;

-- Create ticket_priority type if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'ticket_priority') THEN
        CREATE TYPE ticket_priority AS ENUM ('low', 'medium', 'high', 'urgent');
    END IF;
END $$;

-- Create notification_type type if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'notification_type') THEN
        CREATE TYPE notification_type AS ENUM ('ticket_created', 'ticket_updated', 'ticket_assigned', 'system');
    END IF;
END $$;

-- Create organizations table first (referenced by profiles)
CREATE TABLE IF NOT EXISTS organizations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    domain TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create profiles table with role-based access
CREATE TABLE IF NOT EXISTS profiles (
    id UUID REFERENCES auth.users ON DELETE CASCADE,
    email TEXT NOT NULL,
    first_name TEXT,
    last_name TEXT,
    role user_role DEFAULT 'customer',
    organization_id UUID REFERENCES organizations(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    PRIMARY KEY (id)
);

-- Create tickets table
CREATE TABLE IF NOT EXISTS tickets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    description TEXT,
    status ticket_status DEFAULT 'open',
    priority ticket_priority DEFAULT 'medium',
    customer_id UUID REFERENCES profiles(id),
    assigned_agent_id UUID REFERENCES profiles(id),
    organization_id UUID REFERENCES organizations(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create knowledge_articles table
CREATE TABLE IF NOT EXISTS knowledge_articles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    category TEXT,
    tags TEXT[],
    author_id UUID REFERENCES profiles(id),
    organization_id UUID REFERENCES organizations(id),
    is_published BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create notifications table
CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES profiles(id),
    type notification_type NOT NULL,
    title TEXT NOT NULL,
    message TEXT,
    is_read BOOLEAN DEFAULT FALSE,
    ticket_id UUID REFERENCES tickets(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE knowledge_articles ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist before creating new ones
DROP POLICY IF EXISTS "Users can view their organization" ON organizations;
DROP POLICY IF EXISTS "Users can view their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON profiles;
DROP POLICY IF EXISTS "Admins can view all profiles in their organization" ON profiles;
DROP POLICY IF EXISTS "Customers can view their own tickets" ON tickets;
DROP POLICY IF EXISTS "Agents can view tickets in their organization" ON tickets;
DROP POLICY IF EXISTS "Users can create tickets" ON tickets;
DROP POLICY IF EXISTS "Agents can update tickets in their organization" ON tickets;
DROP POLICY IF EXISTS "Everyone can view published articles" ON knowledge_articles;
DROP POLICY IF EXISTS "Agents can manage articles in their organization" ON knowledge_articles;
DROP POLICY IF EXISTS "Users can view their own notifications" ON notifications;
DROP POLICY IF EXISTS "Users can update their own notifications" ON notifications;

-- RLS Policies for organizations
CREATE POLICY "Users can view their organization" ON organizations
    FOR SELECT USING (
        id IN (
            SELECT organization_id FROM profiles 
            WHERE id = auth.uid()
        )
    );

-- RLS Policies for profiles
CREATE POLICY "Users can view their own profile" ON profiles
    FOR SELECT USING (id = auth.uid());

CREATE POLICY "Users can update their own profile" ON profiles
    FOR UPDATE USING (id = auth.uid());

CREATE POLICY "Admins can view all profiles in their organization" ON profiles
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM profiles admin_profile
            WHERE admin_profile.id = auth.uid()
            AND admin_profile.role = 'admin'
            AND admin_profile.organization_id = profiles.organization_id
        )
    );

-- RLS Policies for tickets
CREATE POLICY "Customers can view their own tickets" ON tickets
    FOR SELECT USING (customer_id = auth.uid());

CREATE POLICY "Agents can view tickets in their organization" ON tickets
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() 
            AND role IN ('agent', 'admin')
            AND organization_id = tickets.organization_id
        )
    );

CREATE POLICY "Users can create tickets" ON tickets
    FOR INSERT WITH CHECK (customer_id = auth.uid());

CREATE POLICY "Agents can update tickets in their organization" ON tickets
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() 
            AND role IN ('agent', 'admin')
            AND organization_id = tickets.organization_id
        )
    );

-- RLS Policies for knowledge articles
CREATE POLICY "Everyone can view published articles" ON knowledge_articles
    FOR SELECT USING (is_published = true);

CREATE POLICY "Agents can manage articles in their organization" ON knowledge_articles
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() 
            AND role IN ('agent', 'admin')
            AND organization_id = knowledge_articles.organization_id
        )
    );

-- RLS Policies for notifications
CREATE POLICY "Users can view their own notifications" ON notifications
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can update their own notifications" ON notifications
    FOR UPDATE USING (user_id = auth.uid());

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

-- Insert demo data
INSERT INTO organizations (name, domain) VALUES 
    ('Default Organization', 'default.com'),
    ('Tech Solutions Inc', 'techsolutions.com'),
    ('Customer Support Co', 'customersupport.com')
ON CONFLICT (name) DO NOTHING;

-- Create demo knowledge articles
INSERT INTO knowledge_articles (title, content, category, tags, is_published, organization_id)
SELECT 
    'Getting Started Guide',
    'Welcome to our service desk! This guide will help you get started with creating and managing tickets.',
    'Getting Started',
    ARRAY['guide', 'basics', 'tickets'],
    true,
    id
FROM organizations WHERE name = 'Default Organization'
ON CONFLICT DO NOTHING;

INSERT INTO knowledge_articles (title, content, category, tags, is_published, organization_id)
SELECT 
    'Password Reset Instructions',
    'If you forgot your password, click on the "Forgot Password" link on the login page and follow the instructions.',
    'Account Management',
    ARRAY['password', 'reset', 'account'],
    true,
    id
FROM organizations WHERE name = 'Default Organization'
ON CONFLICT DO NOTHING;

-- Create demo tickets (these will be created after demo users sign up)
-- The tickets will be created automatically when users with the demo email patterns sign up

COMMIT;
