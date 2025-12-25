/*
 * SUPABASE DATABASE SETUP
 *
 * Run these SQL commands in your Supabase SQL Editor to create the required tables:
 * https://xuqvzlbfqdkfjjhdvzac.supabase.co
 *
 * Go to: SQL Editor -> New Query -> Paste the SQL below -> Run
 */

/*

-- Create workers table
CREATE TABLE workers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  worker_id TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  password_hash TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create sites table
CREATE TABLE sites (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  site_name TEXT NOT NULL,
  latitude DECIMAL NOT NULL,
  longitude DECIMAL NOT NULL,
  qr_token TEXT NOT NULL UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create shifts table
CREATE TABLE shifts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  worker_id TEXT NOT NULL,
  site_id UUID NOT NULL,
  work_date DATE NOT NULL,
  entry_time TIMESTAMPTZ,
  leave_time TIMESTAMPTZ,
  lunch_start TIMESTAMPTZ,
  lunch_end TIMESTAMPTZ,
  worked_hours NUMERIC DEFAULT 0,
  sunday_hours NUMERIC DEFAULT 0,
  ot_hours NUMERIC DEFAULT 0,
  is_sunday BOOLEAN DEFAULT false,
  has_left BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create admin_status table for heartbeat system
CREATE TABLE admin_status (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  admin_email TEXT NOT NULL,
  last_seen TIMESTAMP WITH TIME ZONE NOT NULL,
  is_online BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX idx_shifts_worker_id ON shifts(worker_id);
CREATE INDEX idx_shifts_site_id ON shifts(site_id);
CREATE INDEX idx_shifts_work_date ON shifts(work_date);
CREATE INDEX idx_shifts_created_at ON shifts(created_at DESC);

-- Enable Row Level Security (RLS)
ALTER TABLE workers ENABLE ROW LEVEL SECURITY;
ALTER TABLE sites ENABLE ROW LEVEL SECURITY;
ALTER TABLE shifts ENABLE ROW LEVEL SECURITY;

-- Create comprehensive RLS policies (customize for production)
-- Workers table policies
CREATE POLICY "workers_select_policy" ON workers FOR SELECT USING (true);
CREATE POLICY "workers_insert_policy" ON workers FOR INSERT WITH CHECK (true);
CREATE POLICY "workers_update_policy" ON workers FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "workers_delete_policy" ON workers FOR DELETE USING (true);

-- Sites table policies
CREATE POLICY "sites_select_policy" ON sites FOR SELECT USING (true);
CREATE POLICY "sites_insert_policy" ON sites FOR INSERT WITH CHECK (true);
CREATE POLICY "sites_update_policy" ON sites FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "sites_delete_policy" ON sites FOR DELETE USING (true);

-- Shifts table policies
CREATE POLICY "shifts_select_policy" ON shifts FOR SELECT USING (true);
CREATE POLICY "shifts_insert_policy" ON shifts FOR INSERT WITH CHECK (true);
CREATE POLICY "shifts_update_policy" ON shifts FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "shifts_delete_policy" ON shifts FOR DELETE USING (true);

-- Admin status table policies
CREATE POLICY "admin_status_select_policy" ON admin_status FOR SELECT USING (true);
CREATE POLICY "admin_status_insert_policy" ON admin_status FOR INSERT WITH CHECK (true);
CREATE POLICY "admin_status_update_policy" ON admin_status FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "admin_status_delete_policy" ON admin_status FOR DELETE USING (true);

*/

export default function DatabaseSetup() {
    return (
        <div style={{
            padding: '20px',
            fontFamily: 'monospace',
            whiteSpace: 'pre-wrap',
            background: '#1a1a1a',
            color: '#00ff00',
            borderRadius: '8px',
            margin: '20px'
        }}>
            <h2>⚠️ SETUP REQUIRED ⚠️</h2>
            <p>Check the source code of this file (DatabaseSetup.jsx) for SQL setup instructions.</p>
        </div>
    );
}
