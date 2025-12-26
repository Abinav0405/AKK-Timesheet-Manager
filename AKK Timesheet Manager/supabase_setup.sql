-- ========================================
-- AKK TIMESHEET MANAGER - COMPLETE DATABASE SETUP
-- Run this entire script in Supabase SQL Editor
-- ========================================

-- Step 1: Create workers table
CREATE TABLE IF NOT EXISTS workers (
  worker_id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  password_hash TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Step 2: Create worker_details table
CREATE TABLE worker_details (
  employee_id TEXT PRIMARY KEY,
  nric_fin TEXT NOT NULL,
  employee_name TEXT NOT NULL,
  designation TEXT NOT NULL,
  date_joined DATE NOT NULL,
  bank_account_number TEXT NOT NULL,
  ot_rate_per_hour NUMERIC(10,2) NOT NULL,
  sun_ph_rate_per_day NUMERIC(10,2) NOT NULL,
  basic_salary_per_day NUMERIC(10,2) NOT NULL,
  annual_leave_balance INTEGER DEFAULT 14,
  medical_leave_balance INTEGER DEFAULT 14,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Step 3: Create working_days_config table
CREATE TABLE working_days_config (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  year INTEGER NOT NULL,
  month INTEGER NOT NULL CHECK (month >= 1 AND month <= 12),
  working_days INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(year, month)
);

-- Step 4: Create shifts table
CREATE TABLE IF NOT EXISTS shifts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  worker_id TEXT NOT NULL,
  site_id TEXT,
  work_date DATE NOT NULL,
  entry_time TIMESTAMP WITH TIME ZONE,
  leave_time TIMESTAMP WITH TIME ZONE,
  lunch_start TIMESTAMP WITH TIME ZONE,
  lunch_end TIMESTAMP WITH TIME ZONE,
  has_left BOOLEAN DEFAULT false,
  worked_hours NUMERIC(5,2) DEFAULT 0,
  sunday_hours NUMERIC(5,2) DEFAULT 0,
  ot_hours NUMERIC(5,2) DEFAULT 0,
  leave_type TEXT CHECK (leave_type IN ('AL', 'MC', 'UNPAID_LEAVE')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Step 5: Create leave_requests table
CREATE TABLE leave_requests (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  employee_id TEXT NOT NULL,
  leave_type TEXT NOT NULL CHECK (leave_type IN ('AL', 'MC')),
  leave_duration TEXT NOT NULL DEFAULT 'full_day' CHECK (leave_duration IN ('full_day', 'half_day_morning', 'half_day_afternoon')),
  from_date DATE NOT NULL,
  to_date DATE NOT NULL,
  reason TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  admin_notes TEXT,
  days_requested INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Step 6: Create breaks table for multiple breaks
CREATE TABLE breaks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  shift_id UUID NOT NULL REFERENCES shifts(id) ON DELETE CASCADE,
  break_start TIMESTAMP WITH TIME ZONE NOT NULL,
  break_end TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Step 7: Create sites table
CREATE TABLE IF NOT EXISTS sites (
  id TEXT PRIMARY KEY,
  site_name TEXT NOT NULL,
  latitude NUMERIC(10,8),
  longitude NUMERIC(11,8),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Step 8: Create admin_status table for heartbeat
CREATE TABLE IF NOT EXISTS admin_status (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  admin_email TEXT NOT NULL,
  last_seen TIMESTAMP WITH TIME ZONE NOT NULL,
  is_online BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ========================================
-- INDEXES FOR PERFORMANCE
-- ========================================

CREATE INDEX idx_worker_details_employee_id ON worker_details(employee_id);
CREATE INDEX idx_working_days_config_year_month ON working_days_config(year, month);
CREATE INDEX idx_leave_requests_employee_id ON leave_requests(employee_id);
CREATE INDEX idx_leave_requests_status ON leave_requests(status);
CREATE INDEX idx_leave_requests_created_at ON leave_requests(created_at DESC);
CREATE INDEX idx_shifts_leave_type ON shifts(leave_type);
CREATE INDEX idx_shifts_work_date_worker_id ON shifts(work_date, worker_id);

-- ========================================
-- ENABLE ROW LEVEL SECURITY (RLS)
-- ========================================

ALTER TABLE workers ENABLE ROW LEVEL SECURITY;
ALTER TABLE worker_details ENABLE ROW LEVEL SECURITY;
ALTER TABLE working_days_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE shifts ENABLE ROW LEVEL SECURITY;
ALTER TABLE leave_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE breaks ENABLE ROW LEVEL SECURITY;
ALTER TABLE sites ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_status ENABLE ROW LEVEL SECURITY;

-- ========================================
-- RLS POLICIES
-- ========================================

-- Workers table policies
CREATE POLICY "workers_select_own_policy" ON workers FOR SELECT USING (auth.jwt() ->> 'role' = 'admin' OR auth.jwt() ->> 'worker_id' = worker_id);
CREATE POLICY "workers_insert_policy" ON workers FOR INSERT WITH CHECK (auth.jwt() ->> 'role' = 'admin');
CREATE POLICY "workers_update_policy" ON workers FOR UPDATE USING (auth.jwt() ->> 'role' = 'admin');
CREATE POLICY "workers_delete_policy" ON workers FOR DELETE USING (auth.jwt() ->> 'role' = 'admin');

-- Worker details policies
CREATE POLICY "worker_details_select_own_policy" ON worker_details FOR SELECT USING (auth.jwt() ->> 'role' = 'admin' OR auth.jwt() ->> 'worker_id' = employee_id);
CREATE POLICY "worker_details_insert_policy" ON worker_details FOR INSERT WITH CHECK (auth.jwt() ->> 'role' = 'admin');
CREATE POLICY "worker_details_update_policy" ON worker_details FOR UPDATE USING (auth.jwt() ->> 'role' = 'admin');
CREATE POLICY "worker_details_delete_policy" ON worker_details FOR DELETE USING (auth.jwt() ->> 'role' = 'admin');

-- Working days config policies
CREATE POLICY "working_days_config_select_policy" ON working_days_config FOR SELECT USING (true);
CREATE POLICY "working_days_config_insert_policy" ON working_days_config FOR INSERT WITH CHECK (true);
CREATE POLICY "working_days_config_update_policy" ON working_days_config FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "working_days_config_delete_policy" ON working_days_config FOR DELETE USING (true);

-- Shifts table policies
CREATE POLICY "shifts_select_policy" ON shifts FOR SELECT USING (auth.jwt() ->> 'role' = 'admin' OR auth.jwt() ->> 'worker_id' = worker_id);
CREATE POLICY "shifts_insert_policy" ON shifts FOR INSERT WITH CHECK (auth.jwt() ->> 'role' = 'admin' OR auth.jwt() ->> 'worker_id' = worker_id);
CREATE POLICY "shifts_update_policy" ON shifts FOR UPDATE USING (auth.jwt() ->> 'role' = 'admin' OR auth.jwt() ->> 'worker_id' = worker_id);
CREATE POLICY "shifts_delete_policy" ON shifts FOR DELETE USING (auth.jwt() ->> 'role' = 'admin' OR auth.jwt() ->> 'worker_id' = worker_id);

-- Leave requests policies
CREATE POLICY "leave_requests_select_policy" ON leave_requests FOR SELECT USING (true);
CREATE POLICY "leave_requests_insert_policy" ON leave_requests FOR INSERT WITH CHECK (true);
CREATE POLICY "leave_requests_update_policy" ON leave_requests FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "leave_requests_delete_policy" ON leave_requests FOR DELETE USING (true);

-- Breaks table policies
CREATE POLICY "breaks_select_policy" ON breaks FOR SELECT USING (true);
CREATE POLICY "breaks_insert_policy" ON breaks FOR INSERT WITH CHECK (true);
CREATE POLICY "breaks_update_policy" ON breaks FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "breaks_delete_policy" ON breaks FOR DELETE USING (true);

-- Sites table policies
CREATE POLICY "sites_select_policy" ON sites FOR SELECT USING (true);
CREATE POLICY "sites_insert_policy" ON sites FOR INSERT WITH CHECK (true);
CREATE POLICY "sites_update_policy" ON sites FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "sites_delete_policy" ON sites FOR DELETE USING (true);

-- Admin status policies
CREATE POLICY "admin_status_select_policy" ON admin_status FOR SELECT USING (true);
CREATE POLICY "admin_status_insert_policy" ON admin_status FOR INSERT WITH CHECK (true);
CREATE POLICY "admin_status_update_policy" ON admin_status FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "admin_status_delete_policy" ON admin_status FOR DELETE USING (true);

-- ========================================
-- INSERT INITIAL DATA
-- ========================================

-- Insert working days for 2025
INSERT INTO working_days_config (year, month, working_days) VALUES
(2025, 1, 27), (2025, 2, 24), (2025, 3, 26), (2025, 4, 26), (2025, 5, 27), (2025, 6, 25),
(2025, 7, 27), (2025, 8, 26), (2025, 9, 26), (2025, 10, 27), (2025, 11, 25), (2025, 12, 27);

-- Insert working days for 2026
INSERT INTO working_days_config (year, month, working_days) VALUES
(2026, 1, 27), (2026, 2, 24), (2026, 3, 26), (2026, 4, 26), (2026, 5, 26), (2026, 6, 26),
(2026, 7, 27), (2026, 8, 26), (2026, 9, 26), (2026, 10, 27), (2026, 11, 25), (2026, 12, 27);

-- Insert worker details data
INSERT INTO worker_details (employee_id, nric_fin, employee_name, designation, date_joined, bank_account_number, ot_rate_per_hour, sun_ph_rate_per_day, basic_salary_per_day, annual_leave_balance, medical_leave_balance) VALUES
('1006', 'G89xxx94Q', 'Ganesan Vengatesan', 'Con''s Worker', '2023-01-26', 'DBS 447-83748-0', 5.51, 53.84, 700.00, 14, 14),
('1007', 'G88xxx86T', 'Ramasamy Ramesh', 'Con''s Worker', '2023-02-07', 'DBS 448-03859-9', 5.51, 53.84, 700.00, 14, 14),
('1009', 'G89xxx37W', 'Mahendiran Venkatesan', 'Electrician', '2023-03-27', 'DBS 448-65350-1', 5.51, 53.84, 700.00, 14, 14),
('1011', 'M43xxx87P', 'Anthonisagayaraj Remi', 'Project Engineer', '2023-07-07', 'DBS 271-716264-0', 6.29, 61.54, 800.00, 14, 14),
('1013', 'G69xxx74R', 'Kholil Md Ebrahim', 'Con''s Worker', '2023-11-06', 'DBS 447-95730-2', 6.29, 61.54, 800.00, 14, 14),
('1015', 'M30XXX71N', 'Annadurai Anbudurai', 'Electrician', '2024-09-06', 'DBS 448-42347-6', 5.90, 57.70, 750.00, 14, 14),
('1022', 'Mxxxx003Q', 'Pulendran Prakash', 'Electrician', '2025-02-04', 'DBS 449-12803-6', 5.51, 53.84, 700.00, 14, 14),
('1024', 'Gxxxx581M', 'Balakrishnan Sathiyamoorthy', 'Construction Worker', '2025-02-24', 'DBS 446-01206-1', 5.32, 52.00, 676.00, 14, 14),
('1025', 'Gxxxx22W', 'Chelladurai Chinraj', 'Construction Worker', '2025-03-04', 'DBS 426-28623-8', 5.11, 50.00, 650.00, 14, 14),
('1026', 'Mxxxx323J', 'Rajaram Arunprakash', 'Construction Worker', '2025-03-16', 'DBS 450-59764-3', 4.92, 48.08, 625.00, 14, 14),
('1027', 'G88xxx02T', 'Karuppaiah Velmurugan', 'Con''s Worker', '2025-05-05', 'DBS 455-746434-4', 4.91, 48.00, 624.00, 14, 14),
('1029', 'Gxxxx714X', 'Murugesan Rasalingam', 'Electrician', '2025-06-04', 'DBS 445-94531-5', 5.74, 56.00, 730.00, 14, 14),
('1030', 'Gxxxx284N', 'Govindhan Muruganantham', 'Construction Worker', '2025-06-23', 'DBS 426-07435-4', 6.29, 61.54, 800.00, 14, 14),
('1031', 'GXXX093P', 'Elangovan Sathish', 'Electrician', '2025-06-30', 'DBS 448-72464-6', 5.90, 57.70, 750.00, 14, 14),
('1032', 'Mxxxx645W', 'Ganesan Sangilimuthu', 'Construction Worker', '2025-06-30', 'DBS 443-95619-0', 4.92, 48.00, 625.00, 14, 14),
('1033', 'Gxxxx088Q', 'A A Johnson Jackab', 'Excavating Machine Operator', '2025-07-26', 'DBS 443-76456-9', 7.87, 76.92, 1000.00, 14, 14),
('1035', 'Gxxxx961W', 'Gopal Kabilan', 'Supervisor & General Foremen', '2025-07-20', 'DBS 456-33467-9', 5.98, 58.46, 760.00, 14, 14),
('1037', 'Mxxxx371P', 'Elangovan Rajarajan', 'Construction Worker', '2025-07-28', 'DBS 448-86707-2', 4.92, 48.00, 625.00, 14, 14),
('1038', 'Gxxxx712Q', 'Muthukrishnan Vembarasan', 'Construction Worker', '2025-08-02', 'DBS 451-85412-7', 5.11, 50.00, 650.00, 14, 14),
('1039', 'Gxxxx613L', 'Nath Sree Upendra', 'Excavating Machine Operator', '2025-08-21', 'DBS 424-78975-5', 5.51, 53.84, 700.00, 14, 14),
('1040', 'Gxxx754P', 'Alagarsamy Jayakumar', 'Construction Worker', '2025-08-10', 'DBS 452-32767-8', 5.35, 52.30, 680.00, 14, 14),
('1041', 'Gxxx497K', 'Mani Raja', 'Construction Worker cum Driver', '2025-08-12', 'SC 0105955558', 7.87, 76.92, 1000.00, 14, 14),
('1042', 'Gxxxx174Q', 'Apu Apu Sarwar', 'Construction Lorry Driver', '2025-08-08', 'DBS 450-11103-1', 10.00, 80.00, 1270.00, 14, 14),
('1043', 'Gxxxx580K', 'Arumugam Muthuchamy', 'Supervisor & General Foremen', '2025-08-15', 'DBS 449-38242-0', 7.87, 76.92, 1000.00, 14, 14),
('1047', 'Mxxxx292L', 'Gunasekaran Bharathi', 'Electrical Engineer', '2025-08-16', 'DBS 272-641329-6', 6.00, 50.00, 800.00, 14, 14),
('1048', 'Gxxxx945M', 'Karuppiah Sureshkumar', 'Construction Lorry Driver', '2025-09-02', 'DBS 402-64097-9', 10.00, 80.00, 1270.00, 14, 14),
('1049', 'Fxxxx546U', 'Venu Vijayakumar', 'Con''s Heavy Truck Driver', '2025-09-02', 'DBS 357-09778-9', 10.00, 80.00, 1270.00, 14, 14),
('1050', 'Mxxxx678T', 'A P Subashchandrabose', 'Construction Worker', '2025-10-02', 'DBS 450-84309-1', 5.31, 51.92, 675.00, 14, 14),
('1052', 'Mxxxx762U', 'Pugalenthi Akash', 'Construction Worker', '2025-10-30', 'DBS 450-84309-1', 4.50, 44.00, 572.00, 14, 14);

-- ========================================
-- MIGRATION COMPLETE
-- ========================================

-- You can now run the application!
-- All tables, policies, and data are set up.
