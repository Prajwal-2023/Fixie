-- Demo Users Setup for Fixie Pro
-- Run this AFTER the main auth-setup.sql

-- Insert demo users (these will be created when someone signs up with these emails)
-- The trigger will automatically assign roles based on email domain

-- Demo user credentials for testing:
-- 1. admin@fixie.com / admin123 (Admin role)
-- 2. agent@fixie.com / agent123 (Agent role)  
-- 3. user@fixie.com / user123 (User role)

-- You can sign up with these emails to get the respective roles automatically

-- Additional sample tickets for testing different scenarios
INSERT INTO tickets (title, description, status, priority, organization_id, created_by) VALUES
('AI Feature Request', 'Please add more AI-powered features to the platform.', 'open', 'high', '00000000-0000-0000-0000-000000000001', null),
('Mobile App Issue', 'The mobile app is not loading properly on iOS devices.', 'in_progress', 'medium', '00000000-0000-0000-0000-000000000001', null),
('Database Performance', 'Database queries are running slow during peak hours.', 'open', 'high', '00000000-0000-0000-0000-000000000001', null),
('User Training Request', 'Need training materials for new team members.', 'open', 'low', '00000000-0000-0000-0000-000000000001', null),
('Security Update', 'Security patch needs to be applied to all systems.', 'resolved', 'high', '00000000-0000-0000-0000-000000000001', null)
ON CONFLICT DO NOTHING;

-- Sample notifications for testing
INSERT INTO notifications (title, message, type, organization_id) VALUES
('Welcome to Fixie Pro!', 'Your account has been set up successfully. Start exploring the features.', 'info', '00000000-0000-0000-0000-000000000001'),
('New Ticket Assigned', 'You have been assigned a new high-priority ticket.', 'ticket', '00000000-0000-0000-0000-000000000001'),
('System Maintenance', 'Scheduled maintenance will occur tonight from 2-4 AM EST.', 'system', '00000000-0000-0000-0000-000000000001')
ON CONFLICT DO NOTHING;

-- Update search vectors for knowledge articles
UPDATE knowledge_articles SET search_vector = to_tsvector('english', title || ' ' || content);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_tickets_status ON tickets(status);
CREATE INDEX IF NOT EXISTS idx_tickets_priority ON tickets(priority);
CREATE INDEX IF NOT EXISTS idx_tickets_organization ON tickets(organization_id);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_organization ON profiles(organization_id);
CREATE INDEX IF NOT EXISTS idx_knowledge_search ON knowledge_articles USING gin(search_vector);

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;
