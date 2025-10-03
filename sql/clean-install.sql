-- Complete cleanup and fresh install script
-- Run this if verification shows problems

-- Step 1: Clean up any existing table and related objects
DROP TABLE IF EXISTS public.tickets CASCADE;
DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;

-- Step 2: Create fresh table
CREATE TABLE public.tickets (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    ticket_id VARCHAR(100) NOT NULL UNIQUE,
    issue TEXT NOT NULL,
    resolution TEXT NOT NULL CHECK (char_length(resolution) >= 500),
    status VARCHAR(50) NOT NULL,
    confidence INTEGER NOT NULL CHECK (confidence >= 0 AND confidence <= 100),
    date TIMESTAMP WITH TIME ZONE NOT NULL,
    agent_notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Step 3: Create indexes
CREATE INDEX idx_tickets_ticket_id ON public.tickets(ticket_id);
CREATE INDEX idx_tickets_status ON public.tickets(status);
CREATE INDEX idx_tickets_date ON public.tickets(date);
CREATE INDEX idx_tickets_created_at ON public.tickets(created_at);

-- Step 4: Create trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = TIMEZONE('utc'::text, NOW());
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Step 5: Create trigger
CREATE TRIGGER update_tickets_updated_at
    BEFORE UPDATE ON public.tickets
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Step 6: Enable RLS
ALTER TABLE public.tickets ENABLE ROW LEVEL SECURITY;

-- Step 7: Create permissive policy for development
CREATE POLICY "Allow all operations for everyone" ON public.tickets
    FOR ALL USING (true);

-- Step 8: Grant permissions
GRANT ALL ON public.tickets TO authenticated;
GRANT ALL ON public.tickets TO service_role;
GRANT ALL ON public.tickets TO anon;

-- Step 9: Insert test data
INSERT INTO public.tickets (ticket_id, issue, resolution, status, confidence, date, agent_notes)
VALUES 
(
    'DEMO-001',
    'User unable to connect to VPN',
    'AGENT ACTIONS PERFORMED: Analyzed VPN connection issues and identified DNS resolution problems. Reviewed user network configuration and found conflicting network adapters. Updated network adapter settings and configured proper DNS servers. Tested VPN connection multiple times to ensure stability. Provided user with backup connection methods in case of future issues. Documented resolution steps for similar cases. Verified all corporate security policies were maintained during troubleshooting. Confirmed user can access all required internal resources through VPN connection. Scheduled follow-up to ensure continued functionality.',
    'Worked',
    95,
    NOW(),
    'User confirmed VPN working after DNS configuration changes'
),
(
    'DEMO-002', 
    'Printer not responding to print jobs',
    'AGENT ACTIONS PERFORMED: Investigated printer connectivity and driver issues. Checked network connectivity between user workstation and printer. Found outdated printer drivers causing communication failures. Downloaded and installed latest drivers from manufacturer website. Cleared print spooler queue and restarted print spooler service. Configured printer preferences for optimal performance. Tested multiple document types including text, images, and PDFs. Verified print queue management is working correctly. Educated user on basic printer troubleshooting steps. Updated asset management system with new driver version information. Created documentation for similar printer models in the environment.',
    'Worked',
    88,
    NOW(),
    'Printer functioning normally after driver update and spooler reset'
);

-- Step 10: Final verification
SELECT 'SUCCESS: Table created and configured!' as message;
SELECT COUNT(*) as total_tickets FROM public.tickets;
SELECT 'First ticket: ' || ticket_id || ' - ' || issue as sample FROM public.tickets LIMIT 1;
