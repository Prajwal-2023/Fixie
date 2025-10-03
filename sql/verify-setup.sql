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

-- Check Row Level Security status
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE tablename = 'tickets';

-- Check policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies 
WHERE tablename = 'tickets';

-- Count tickets (if table exists)
SELECT COUNT(*) as total_tickets FROM public.tickets;

-- Show sample tickets (if any exist)
SELECT ticket_id, issue, status, confidence FROM public.tickets LIMIT 3;
