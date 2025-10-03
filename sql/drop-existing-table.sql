-- CAUTION: This will delete all existing tickets!
-- Only run this if you want to start completely fresh

-- Drop the existing table (this will delete all data!)
DROP TABLE IF EXISTS public.tickets CASCADE;

-- Now you can run the original create-tickets-table.sql
-- to create the table with the correct structure

SELECT 'Existing table dropped. Now run create-tickets-table.sql' as message;
