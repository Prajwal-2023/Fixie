-- COMPLETE FRESH DATABASE SETUP FOR FIXIE PRO
-- Run this single script to set up everything from scratch

-- 1. Drop all existing tables in correct order (to handle foreign keys)
DROP TABLE IF EXISTS notifications CASCADE;
DROP TABLE IF EXISTS knowledge_articles CASCADE;
DROP TABLE IF EXISTS tickets CASCADE;
DROP TABLE IF EXISTS profiles CASCADE;
DROP TABLE IF EXISTS users CASCADE;
DROP TABLE IF EXISTS organizations CASCADE;

-- 2. Drop any existing triggers and functions
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();
DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;

-- 3. Create Organizations table
CREATE TABLE organizations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(100) UNIQUE NOT NULL,
  logo_url TEXT,
  theme_color VARCHAR(7) DEFAULT '#3b82f6',
  settings JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 4. Create Profiles table (linked to auth.users)
CREATE TABLE profiles (
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

-- 5. Create enhanced Tickets table
CREATE TABLE tickets (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title VARCHAR(500) NOT NULL,
  description TEXT NOT NULL,
  status VARCHAR(50) DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'resolved', 'closed')),
  priority VARCHAR(20) DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  category VARCHAR(100),
  tags TEXT[],
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  created_by UUID REFERENCES profiles(id),
  assigned_to UUID REFERENCES profiles(id),
  -- AI-powered fields
  sentiment_score DECIMAL(3,2) DEFAULT 0.0,
  ai_category VARCHAR(100),
  ai_suggested_resolution TEXT,
  ai_priority_score INTEGER DEFAULT 0,
  -- Metadata
  resolved_at TIMESTAMP WITH TIME ZONE,
  closed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 6. Create Knowledge Articles table
CREATE TABLE knowledge_articles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title VARCHAR(500) NOT NULL,
  content TEXT NOT NULL,
  excerpt TEXT,
  category VARCHAR(100),
  tags TEXT[],
  author_id UUID REFERENCES profiles(id),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  is_published BOOLEAN DEFAULT false,
  view_count INTEGER DEFAULT 0,
  helpful_count INTEGER DEFAULT 0,
  not_helpful_count INTEGER DEFAULT 0,
  search_vector tsvector,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 7. Create Notifications table
CREATE TABLE notifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  type VARCHAR(50) DEFAULT 'info' CHECK (type IN ('info', 'warning', 'error', 'success', 'ticket', 'system')),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id),
  is_read BOOLEAN DEFAULT false,
  expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW') NOT NULL
);

-- 8. Enable Row Level Security
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE knowledge_articles ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- 9. Create default organization
INSERT INTO organizations (id, name, slug, theme_color) 
VALUES (
  '00000000-0000-0000-0000-000000000001',
  'Fixie Support',
  'fixie-support',
  '#3b82f6'
);

-- 10. Create user signup trigger
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

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 11. Create RLS Policies
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

-- Organizations policies
CREATE POLICY "Users can view their organization" ON organizations
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND organization_id = organizations.id
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
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

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

-- Notifications policies
CREATE POLICY "Users can view own notifications" ON notifications
  FOR SELECT USING (
    user_id = auth.uid() OR 
    user_id IS NULL AND EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND organization_id = notifications.organization_id
    )
  );

-- 12. Insert sample data
INSERT INTO knowledge_articles (title, content, excerpt, category, is_published, organization_id) VALUES
('Getting Started with Fixie Pro', 'Welcome to Fixie Pro! This comprehensive guide will help you get started with our enterprise service desk platform. Learn about creating tickets, managing users, and leveraging AI-powered insights.', 'Complete getting started guide', 'Getting Started', true, '00000000-0000-0000-0000-000000000001'),
('How to Create and Manage Tickets', 'Learn the complete process of creating, updating, and resolving support tickets. Understand priority levels, status workflows, and best practices for ticket management.', 'Ticket management best practices', 'Tickets', true, '00000000-0000-0000-0000-000000000001'),
('User Roles and Permissions', 'Understand the different user roles in Fixie Pro: Admin, Agent, and User. Learn about permissions, access levels, and role-based features.', 'Complete guide to user roles', 'Administration', true, '00000000-0000-0000-0000-000000000001'),
('AI-Powered Features Guide', 'Discover how Fixie Pro uses artificial intelligence to enhance your support experience. Learn about sentiment analysis, smart categorization, and automated insights.', 'AI features overview', 'AI Features', true, '00000000-0000-0000-0000-000000000001');

INSERT INTO tickets (title, description, status, priority, organization_id) VALUES
('Welcome to Fixie Pro!', 'This is your first sample ticket. You can edit, assign, and resolve tickets using the advanced ticket management interface.', 'open', 'medium', '00000000-0000-0000-0000-000000000001'),
('High Priority System Alert', 'This demonstrates a high-priority ticket with urgent attention required. Notice the color coding and priority indicators.', 'in_progress', 'high', '00000000-0000-0000-0000-000000000001'),
('Feature Request Example', 'This ticket shows how feature requests are tracked and managed in the system.', 'open', 'low', '00000000-0000-0000-0000-000000000001'),
('Resolved Ticket Example', 'This ticket demonstrates the resolved status and how completed tickets are displayed.', 'resolved', 'medium', '00000000-0000-0000-0000-000000000001');

INSERT INTO notifications (title, message, type, organization_id) VALUES
('🎉 Welcome to Fixie Pro!', 'Your enterprise service desk is ready! Explore advanced features like AI insights, real-time notifications, and comprehensive analytics.', 'success', '00000000-0000-0000-0000-000000000001'),
('🔔 New Ticket Alert', 'A high-priority ticket has been created and requires attention. Check the tickets page for details.', 'ticket', '00000000-0000-0000-0000-000000000001'),
('ℹ️ System Status', 'All systems are operating normally. Real-time features and AI services are fully functional.', 'info', '00000000-0000-0000-0000-000000000001');

-- 13. Update search vectors for knowledge articles
UPDATE knowledge_articles SET search_vector = to_tsvector('english', title || ' ' || content);

-- 14. Create performance indexes
CREATE INDEX idx_tickets_status ON tickets(status);
CREATE INDEX idx_tickets_priority ON tickets(priority);
CREATE INDEX idx_tickets_organization ON tickets(organization_id);
CREATE INDEX idx_profiles_role ON profiles(role);
CREATE INDEX idx_profiles_organization ON profiles(organization_id);
CREATE INDEX idx_knowledge_search ON knowledge_articles USING gin(search_vector);
CREATE INDEX idx_notifications_user ON notifications(user_id);
CREATE INDEX idx_notifications_org ON notifications(organization_id);

-- 15. Grant necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- ✅ Setup Complete! 
-- Next steps:
-- 1. Go to http://localhost:8080/
-- 2. Sign up with: admin@fixie.com / admin123
-- 3. Or create your own account
-- 4. Explore all the features!
