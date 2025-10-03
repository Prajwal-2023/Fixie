-- Simple verification script to check your Supabase setup
-- Run this in your Supabase SQL Editor to see what exists

-- Check if tickets table exists
SELECT table_name, column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'tickets' 
ORDER BY ordinal_position;

-- Check table permissions
SELECT schemaname, tablename, tableowner 
FROM pg_tables 
WHERE tablename = 'tickets';

-- Verification script to check if setup was successful
-- Run this after fresh-setup.sql to verify everything is working

-- Check if all tables exist
SELECT 
  'organizations' as table_name, 
  count(*) as record_count 
FROM organizations
UNION ALL
SELECT 
  'profiles' as table_name, 
  count(*) as record_count 
FROM profiles
UNION ALL
SELECT 
  'tickets' as table_name, 
  count(*) as record_count 
FROM tickets
UNION ALL
SELECT 
  'knowledge_articles' as table_name, 
  count(*) as record_count 
FROM knowledge_articles
UNION ALL
SELECT 
  'notifications' as table_name, 
  count(*) as record_count 
FROM notifications;

-- Check if RLS is enabled
SELECT 
    schemaname,
    tablename,
    rowsecurity,
    hasrls
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('organizations', 'profiles', 'tickets', 'knowledge_articles', 'notifications');

-- Check if trigger exists
SELECT 
    trigger_name,
    event_object_table,
    trigger_schema
FROM information_schema.triggers 
WHERE trigger_name = 'on_auth_user_created';

-- If you see:
-- ✅ All tables with record counts > 0
-- ✅ All tables have rowsecurity = true
-- ✅ Trigger exists
-- Then setup was successful!

-- Check policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies 
WHERE tablename = 'tickets';

-- Count tickets (if table exists)
SELECT COUNT(*) as total_tickets FROM public.tickets;

-- Show sample tickets (if any exist)
SELECT ticket_id, issue, status, confidence FROM public.tickets LIMIT 3;
