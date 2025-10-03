-- Authentication Setup for Fixie Pro
-- Run this in Supabase SQL Editor FIRST

-- 1. Enable RLS (Row Level Security)
ALTER TABLE IF EXISTS tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS users ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS knowledge_articles ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS notifications ENABLE ROW LEVEL SECURITY;

-- 2. Create profiles table that links to auth.users
CREATE TABLE IF NOT EXISTS profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  avatar_url TEXT,
  role VARCHAR(50) DEFAULT 'user' CHECK (role IN ('admin', 'agent', 'user')),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  is_active BOOLEAN DEFAULT true,
  last_login_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 3. Create default organization
INSERT INTO organizations (id, name, slug, theme_color) 
VALUES (
  '00000000-0000-0000-0000-000000000001',
  'Fixie Support',
  'fixie-support',
  '#3b82f6'
) ON CONFLICT (id) DO NOTHING;

-- 4. Create admin user trigger
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, name, role, organization_id)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    CASE 
      WHEN NEW.email = 'admin@fixie.com' THEN 'admin'
      WHEN NEW.email LIKE '%@fixie.com' THEN 'agent'
      ELSE 'user'
    END,
    '00000000-0000-0000-0000-000000000001'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Create trigger for new users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 6. RLS Policies
-- Profiles policies
CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Admins can view all profiles" ON profiles
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Tickets policies
CREATE POLICY "Users can view tickets in their org" ON tickets
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND organization_id = tickets.organization_id
    )
  );

CREATE POLICY "Users can create tickets" ON tickets
  FOR INSERT WITH CHECK (
    auth.uid() IS NOT NULL
  );

-- Organizations policies  
CREATE POLICY "Users can view their organization" ON organizations
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND organization_id = organizations.id
    )
  );

-- Knowledge articles policies
CREATE POLICY "Anyone can view published articles" ON knowledge_articles
  FOR SELECT USING (is_published = true);

CREATE POLICY "Agents can manage articles" ON knowledge_articles
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND role IN ('admin', 'agent')
    )
  );

-- 7. Sample data
-- Create demo admin user (you'll need to sign up with this email)
-- Email: admin@fixie.com, Password: admin123 (change after signup)

-- Sample knowledge articles
INSERT INTO knowledge_articles (title, content, excerpt, category, is_published, organization_id) VALUES
('Getting Started', 'Welcome to Fixie Pro! This guide will help you get started with our service desk platform.', 'Quick start guide for new users', 'Getting Started', true, '00000000-0000-0000-0000-000000000001'),
('How to Create Tickets', 'Learn how to create and manage support tickets effectively.', 'Ticket creation guide', 'Tickets', true, '00000000-0000-0000-0000-000000000001'),
('User Roles and Permissions', 'Understanding different user roles: Admin, Agent, and User.', 'Role-based access guide', 'Administration', true, '00000000-0000-0000-0000-000000000001')
ON CONFLICT DO NOTHING;

-- Sample tickets for testing
INSERT INTO tickets (title, description, status, priority, organization_id) VALUES
('Welcome Ticket', 'This is a sample ticket to get you started with Fixie Pro.', 'open', 'medium', '00000000-0000-0000-0000-000000000001'),
('Test High Priority', 'This is a high priority ticket for testing.', 'in_progress', 'high', '00000000-0000-0000-0000-000000000001'),
('Resolved Example', 'This ticket shows what a resolved ticket looks like.', 'resolved', 'low', '00000000-0000-0000-0000-000000000001')
ON CONFLICT DO NOTHING;
