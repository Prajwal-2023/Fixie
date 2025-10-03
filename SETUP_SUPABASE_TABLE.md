# 🚀 Supabase Database Setup Guide

## ❌ Current Error: `Could not find the table 'public.tickets'`

**Root Cause:** The `tickets` table doesn't exist in your Supabase database yet.

---

## ✅ **Step-by-Step Fix:**

### 1. **Access Supabase Dashboard**
1. Go to [supabase.com](https://supabase.com) and sign in
2. Navigate to your project dashboard
3. Click on the **SQL Editor** tab in the left sidebar

### 2. **Create the Tickets Table**
1. In the SQL Editor, click **"New Query"**
2. Copy the **entire contents** from `sql/create-tickets-table.sql`
3. Paste it into the SQL editor
4. Click **"Run"** to execute the SQL

### 3. **Verify Table Creation**
1. Go to the **Table Editor** tab in the left sidebar
2. You should see a new table called **`tickets`**
3. Click on it to see the table structure

### 4. **Check Environment Variables**
1. Verify your `.env` file has the correct Supabase credentials:
   ```bash
   VITE_SUPABASE_URL=https://your-project-id.supabase.co
   VITE_SUPABASE_PUBLISHABLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   ```
2. Get these values from **Settings > API** in your Supabase dashboard

---

## 📋 **Complete SQL Schema to Copy:**

```sql
-- Supabase SQL Schema for Fixie Tickets Table
-- Run this in your Supabase SQL editor to create the tickets table

-- Create tickets table
CREATE TABLE IF NOT EXISTS public.tickets (
    -- Primary key
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    
    -- Required fields
    ticket_id VARCHAR(100) NOT NULL UNIQUE,
    issue TEXT NOT NULL,
    resolution TEXT NOT NULL CHECK (char_length(resolution) >= 500), -- Minimum 500 characters
    status VARCHAR(50) NOT NULL,
    confidence INTEGER NOT NULL CHECK (confidence >= 0 AND confidence <= 100),
    date TIMESTAMP WITH TIME ZONE NOT NULL,
    
    -- Optional field
    agent_notes TEXT,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_tickets_ticket_id ON public.tickets(ticket_id);
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

-- Enable Row Level Security (RLS)
ALTER TABLE public.tickets ENABLE ROW LEVEL SECURITY;

-- Create policy to allow all operations for authenticated users
-- You can modify this based on your security requirements
CREATE POLICY "Enable all operations for all users" ON public.tickets
    FOR ALL USING (true)
    WITH CHECK (true);

-- Insert sample data for testing (optional)
INSERT INTO public.tickets (
    ticket_id,
    issue,
    resolution,
    status,
    confidence,
    date
) VALUES (
    'INC0012345',
    'Network connectivity issue',
    'Performed comprehensive network troubleshooting including DNS resolution checks, firewall configuration validation, and network adapter driver updates. Verified all network settings and connectivity to external resources. Updated network configuration files and restarted network services. Conducted end-to-end connectivity tests to ensure full resolution. The issue was resolved after updating the network adapter drivers and resetting the TCP/IP stack. All network functionality has been restored and validated with the end user. This resolution provides a complete step-by-step approach to resolving network connectivity issues in enterprise environments.',
    'Worked',
    95,
    '2025-10-03 12:00:00+00'
);
```

---

## 🔧 **After Running the SQL:**

### Test the Connection:
1. Run your application: `npm run dev`
2. Try using the feedback form
3. Check the Analytics page for data

### Verify in Supabase:
1. Go to **Table Editor** > **tickets**
2. You should see the sample ticket if you included the INSERT statement
3. Try adding more tickets through your application

---

## 🛠️ **Troubleshooting:**

### If you still get connection errors:

1. **Check Environment Variables:**
   ```bash
   # Run this to test your setup
   node test-supabase.js
   ```

2. **Verify Supabase URL and Key:**
   - Go to Supabase Dashboard > Settings > API
   - Copy the **Project URL** and **anon/public key**
   - Update your `.env` file

3. **Check RLS Policies:**
   - The SQL above creates a permissive policy for testing
   - For production, you'll want more restrictive policies

### Common Issues:

❌ **"Invalid API key"**: Wrong `VITE_SUPABASE_PUBLISHABLE_KEY`
❌ **"Project not found"**: Wrong `VITE_SUPABASE_URL`
❌ **"Permission denied"**: RLS policy issue
❌ **"Table not found"**: SQL schema not executed

---

## ✅ **Success Indicators:**

After completing setup, you should see:
- ✅ **Table Editor** shows `tickets` table
- ✅ **Application** loads without connection errors
- ✅ **Feedback Form** successfully submits
- ✅ **Analytics Page** shows connection status as "Supabase"
- ✅ **Console** shows "✅ Successfully connected to Supabase tickets table"

---

## 🎯 **Next Steps After Setup:**

1. **Test the Application:**
   - Submit feedback through the form
   - Check Analytics page for data
   - Try searching for tickets

2. **Explore Functions:**
   - Use TicketSearchExample component
   - Try TicketUpdateExample component
   - Test TicketDeleteExample component

3. **Customize Security:**
   - Review RLS policies for your use case
   - Set up proper authentication if needed
   - Configure user-specific access rules

---

## 🆘 **Need Help?**

If you're still having issues:
1. Check browser console for detailed errors
2. Verify Supabase project is active (not paused)
3. Ensure you're using the correct project credentials
4. Try creating a simple test query in Supabase SQL editor

**Your table setup should work perfectly after running the SQL schema!** 🚀
