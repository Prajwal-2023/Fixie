-- CLEANUP SCRIPT - Run this FIRST to remove old conflicting tables
-- Copy and paste this entire script in Supabase SQL Editor

-- Drop all existing tables to start fresh
DROP TABLE IF EXISTS analytics_events CASCADE;
DROP TABLE IF EXISTS knowledge_articles CASCADE;
DROP TABLE IF EXISTS notifications CASCADE;
DROP TABLE IF EXISTS organizations CASCADE;
DROP TABLE IF EXISTS sla_policies CASCADE;
DROP TABLE IF EXISTS ticket_comments CASCADE;
DROP TABLE IF EXISTS ticket_templates CASCADE;
DROP TABLE IF EXISTS tickets CASCADE;
DROP TABLE IF EXISTS users CASCADE;
DROP TABLE IF EXISTS profiles CASCADE;

-- Drop any existing triggers and functions
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;
DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;

-- Clean up any existing policies (they get dropped with tables)
-- This ensures no conflicts when we recreate everything

SELECT 'All old tables and functions have been cleaned up!' as status;
