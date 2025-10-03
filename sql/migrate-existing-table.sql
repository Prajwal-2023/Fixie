-- Migration SQL to update existing tickets table
-- Run this in your Supabase SQL editor to add missing fields

-- Add missing columns to existing table
ALTER TABLE public.tickets ADD COLUMN IF NOT EXISTS id UUID DEFAULT gen_random_uuid();
ALTER TABLE public.tickets ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW());

-- Update created_at to use proper timezone format if needed
ALTER TABLE public.tickets ALTER COLUMN created_at SET DEFAULT TIMEZONE('utc'::text, NOW());

-- Create a unique constraint on id if it doesn't exist as primary key
-- First, populate any NULL id values
UPDATE public.tickets SET id = gen_random_uuid() WHERE id IS NULL;

-- Make id NOT NULL
ALTER TABLE public.tickets ALTER COLUMN id SET NOT NULL;

-- Add unique constraint on id (but keep ticket_id as primary key)
ALTER TABLE public.tickets ADD CONSTRAINT tickets_id_unique UNIQUE (id);

-- Create indexes for better performance (if they don't exist)
CREATE INDEX IF NOT EXISTS idx_tickets_id ON public.tickets(id);
CREATE INDEX IF NOT EXISTS idx_tickets_status ON public.tickets(status);
CREATE INDEX IF NOT EXISTS idx_tickets_date ON public.tickets(date);
CREATE INDEX IF NOT EXISTS idx_tickets_created_at ON public.tickets(created_at);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = TIMEZONE('utc'::text, NOW());
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_tickets_updated_at ON public.tickets;
CREATE TRIGGER update_tickets_updated_at
    BEFORE UPDATE ON public.tickets
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security (RLS) if not already enabled
ALTER TABLE public.tickets ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Allow all operations for authenticated users" ON public.tickets;
DROP POLICY IF EXISTS "Allow all operations for everyone" ON public.tickets;

-- Create policy to allow all operations for everyone (for development)
CREATE POLICY "Allow all operations for everyone" ON public.tickets
    FOR ALL USING (true);

-- Grant permissions
GRANT ALL ON public.tickets TO authenticated;
GRANT ALL ON public.tickets TO service_role;

-- Verify migration
SELECT 'Table migration completed successfully!' as message;
SELECT COUNT(*) as existing_tickets FROM public.tickets;
