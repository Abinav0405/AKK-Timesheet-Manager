/*
 * SUPABASE DATABASE MIGRATION - LEAVE TYPES & LIMITS UPDATE
 *
 * Run these SQL commands in your Supabase SQL Editor to update the database schema:
 * https://xuqvzlbfqdkfjjhdvzac.supabase.co
 *
 * Go to: SQL Editor -> New Query -> Paste the SQL below -> Run
 */

/*

-- MIGRATION: Update leave types and add leave limits
-- Run this SQL in Supabase SQL Editor to update the database

-- Step 1: Update leave_requests table to support expanded leave types
ALTER TABLE leave_requests DROP CONSTRAINT IF EXISTS leave_requests_leave_type_check;
ALTER TABLE leave_requests ADD CONSTRAINT leave_requests_leave_type_check CHECK (leave_type IN (
    'Annual Leave', 'Maternity Leave', 'Paternity Leave', 'Shared Parental Leave',
    'Childcare Leave', 'Sick Leave & Hospitalisation Leave', 'National Service (NS) Leave',
    'Adoption Leave', 'Non-Statutory Leave (Employer Provided)', 'Compassionate / Bereavement Leave',
    'Marriage Leave', 'Study / Exam Leave', 'Birthday Leave', 'Mental Health Day',
    'Volunteer Leave', 'Unpaid Leave'
));

-- Step 2: Update shifts table to support expanded leave types
ALTER TABLE shifts DROP CONSTRAINT IF EXISTS shifts_leave_type_check;
ALTER TABLE shifts ADD CONSTRAINT shifts_leave_type_check CHECK (leave_type IN (
    'Annual Leave', 'Maternity Leave', 'Paternity Leave', 'Shared Parental Leave',
    'Childcare Leave', 'Sick Leave & Hospitalisation Leave', 'National Service (NS) Leave',
    'Adoption Leave', 'Non-Statutory Leave (Employer Provided)', 'Compassionate / Bereavement Leave',
    'Marriage Leave', 'Study / Exam Leave', 'Birthday Leave', 'Mental Health Day',
    'Volunteer Leave', 'Unpaid Leave',
    'Annual Leave_HALF_MORNING', 'Annual Leave_HALF_AFTERNOON',
    'Maternity Leave_HALF_MORNING', 'Maternity Leave_HALF_AFTERNOON',
    'Paternity Leave_HALF_MORNING', 'Paternity Leave_HALF_AFTERNOON',
    'Shared Parental Leave_HALF_MORNING', 'Shared Parental Leave_HALF_AFTERNOON',
    'Childcare Leave_HALF_MORNING', 'Childcare Leave_HALF_AFTERNOON',
    'Sick Leave & Hospitalisation Leave_HALF_MORNING', 'Sick Leave & Hospitalisation Leave_HALF_AFTERNOON',
    'National Service (NS) Leave_HALF_MORNING', 'National Service (NS) Leave_HALF_AFTERNOON',
    'Adoption Leave_HALF_MORNING', 'Adoption Leave_HALF_AFTERNOON',
    'Non-Statutory Leave (Employer Provided)_HALF_MORNING', 'Non-Statutory Leave (Employer Provided)_HALF_AFTERNOON',
    'Compassionate / Bereavement Leave_HALF_MORNING', 'Compassionate / Bereavement Leave_HALF_AFTERNOON',
    'Marriage Leave_HALF_MORNING', 'Marriage Leave_HALF_AFTERNOON',
    'Study / Exam Leave_HALF_MORNING', 'Study / Exam Leave_HALF_AFTERNOON',
    'Birthday Leave_HALF_MORNING', 'Birthday Leave_HALF_AFTERNOON',
    'Mental Health Day_HALF_MORNING', 'Mental Health Day_HALF_AFTERNOON',
    'Volunteer Leave_HALF_MORNING', 'Volunteer Leave_HALF_AFTERNOON'
));

-- Step 3: Add leave limit fields to worker_details if not exists
ALTER TABLE worker_details
ADD COLUMN IF NOT EXISTS annual_leave_limit INTEGER DEFAULT 10,
ADD COLUMN IF NOT EXISTS medical_leave_limit INTEGER DEFAULT 14;

-- Update existing workers with default leave limits
UPDATE worker_details SET annual_leave_limit = 10, medical_leave_limit = 14 WHERE annual_leave_limit IS NULL;

-- Step 4: Create index for better leave queries
CREATE INDEX IF NOT EXISTS idx_leave_requests_leave_type ON leave_requests(leave_type);
CREATE INDEX IF NOT EXISTS idx_worker_details_leave_limits ON worker_details(annual_leave_limit, medical_leave_limit);

-- Step 5: Ensure breaks table exists for multiple breaks support
CREATE TABLE IF NOT EXISTS breaks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  shift_id UUID NOT NULL REFERENCES shifts(id) ON DELETE CASCADE,
  break_start TIMESTAMP WITH TIME ZONE NOT NULL,
  break_end TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Step 5b: Ensure sites table exists for site management + QR scanning
CREATE TABLE IF NOT EXISTS public.sites (
   id text not null,
   site_name text not null,
   latitude numeric(10, 8) null,
   longitude numeric(11, 8) null,
   qr_token text null,
   created_at timestamp with time zone null default now(),
   constraint sites_pkey primary key (id)
 ) TABLESPACE pg_default;

CREATE UNIQUE INDEX IF NOT EXISTS idx_sites_qr_token ON public.sites(qr_token);

ALTER TABLE public.sites ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "sites_select_policy" ON public.sites;
DROP POLICY IF EXISTS "sites_insert_policy" ON public.sites;
DROP POLICY IF EXISTS "sites_update_policy" ON public.sites;
DROP POLICY IF EXISTS "sites_delete_policy" ON public.sites;
CREATE POLICY "sites_select_policy" ON public.sites FOR SELECT USING (true);
CREATE POLICY "sites_insert_policy" ON public.sites FOR INSERT WITH CHECK (true);
CREATE POLICY "sites_update_policy" ON public.sites FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "sites_delete_policy" ON public.sites FOR DELETE USING (true);

-- Remove employer salary column from local workers (CPF employer is based on employee wages)
ALTER TABLE public.local_worker_details DROP COLUMN IF EXISTS employer_salary;

-- Enable RLS on breaks table if not already enabled
ALTER TABLE breaks ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "breaks_select_policy" ON breaks;
DROP POLICY IF EXISTS "breaks_insert_policy" ON breaks;
DROP POLICY IF EXISTS "breaks_update_policy" ON breaks;
DROP POLICY IF EXISTS "breaks_delete_policy" ON breaks;

CREATE POLICY "breaks_select_policy" ON breaks FOR SELECT USING (true);
CREATE POLICY "breaks_insert_policy" ON breaks FOR INSERT WITH CHECK (true);
CREATE POLICY "breaks_update_policy" ON breaks FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "breaks_delete_policy" ON breaks FOR DELETE USING (true);

-- Step 6: Migrate existing lunch data to breaks table if lunch columns still exist
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'shifts' AND column_name = 'lunch_start') THEN
        -- Migrate existing lunch data
        INSERT INTO breaks (shift_id, break_start, break_end)
        SELECT id, lunch_start, lunch_end
        FROM shifts
        WHERE lunch_start IS NOT NULL
        ON CONFLICT DO NOTHING;

        -- Drop old lunch columns
        ALTER TABLE shifts DROP COLUMN IF EXISTS lunch_start;
        ALTER TABLE shifts DROP COLUMN IF EXISTS lunch_end;
    END IF;
END $$;

  has_left BOOLEAN DEFAULT false,
  worked_hours NUMERIC(5,2) DEFAULT 0,
  sunday_hours NUMERIC(5,2) DEFAULT 0,
  ot_hours NUMERIC(5,2) DEFAULT 0,
  leave_type TEXT CHECK (leave_type IN ('AL', 'MC', 'UNPAID_LEAVE')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on shifts table
ALTER TABLE shifts ENABLE ROW LEVEL SECURITY;

-- RLS Policies for shifts table
CREATE POLICY "shifts_select_policy" ON shifts FOR SELECT USING (
  auth.jwt() ->> 'role' = 'admin' OR
  auth.jwt() ->> 'worker_id' = worker_id
);
CREATE POLICY "shifts_insert_policy" ON shifts FOR INSERT WITH CHECK (
  auth.jwt() ->> 'role' = 'admin' OR
  auth.jwt() ->> 'worker_id' = worker_id
);
CREATE POLICY "shifts_update_policy" ON shifts FOR UPDATE USING (
  auth.jwt() ->> 'role' = 'admin' OR
  auth.jwt() ->> 'worker_id' = worker_id
);
CREATE POLICY "shifts_delete_policy" ON shifts FOR DELETE USING (
  auth.jwt() ->> 'role' = 'admin' OR
  auth.jwt() ->> 'worker_id' = worker_id
);

-- RLS Policies for leave_requests
CREATE POLICY "leave_requests_select_policy" ON leave_requests FOR SELECT USING (true);
CREATE POLICY "leave_requests_insert_policy" ON leave_requests FOR INSERT WITH CHECK (true);
CREATE POLICY "leave_requests_update_policy" ON leave_requests FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "leave_requests_delete_policy" ON leave_requests FOR DELETE USING (true);

-- Insert working days for 2025
INSERT INTO working_days_config (year, month, working_days) VALUES
(2025, 1, 27), (2025, 2, 24), (2025, 3, 26), (2025, 4, 26), (2025, 5, 27), (2025, 6, 25),
(2025, 7, 27), (2025, 8, 26), (2025, 9, 26), (2025, 10, 27), (2025, 11, 25), (2025, 12, 27);

-- Insert working days for 2026
INSERT INTO working_days_config (year, month, working_days) VALUES
(2026, 1, 27), (2026, 2, 24), (2026, 3, 26), (2026, 4, 26), (2026, 5, 26), (2026, 6, 26),
(2026, 7, 27), (2026, 8, 26), (2026, 9, 26), (2026, 10, 27), (2026, 11, 25), (2026, 12, 27);

-- Insert worker details data
INSERT INTO worker_details (employee_id, nric_fin, employee_name, designation, date_joined, bank_account_number, ot_rate_per_hour, sun_ph_rate_per_day, basic_salary_per_day) VALUES
('1006', 'G89xxx94Q', 'Ganesan Vengatesan', 'Con''s Worker', '2023-01-26', 'DBS 447-83748-0', 5.51, 53.84, 700.00),
('1007', 'G88xxx86T', 'Ramasamy Ramesh', 'Con''s Worker', '2023-02-07', 'DBS 448-03859-9', 5.51, 53.84, 700.00),
('1009', 'G89xxx37W', 'Mahendiran Venkatesan', 'Electrician', '2023-03-27', 'DBS 448-65350-1', 5.51, 53.84, 700.00),
('1011', 'M43xxx87P', 'Anthonisagayaraj Remi', 'Project Engineer', '2023-07-07', 'DBS 271-716264-0', 6.29, 61.54, 800.00),
('1013', 'G69xxx74R', 'Kholil Md Ebrahim', 'Con''s Worker', '2023-11-06', 'DBS 447-95730-2', 6.29, 61.54, 800.00),
('1015', 'M30XXX71N', 'Annadurai Anbudurai', 'Electrician', '2024-09-06', 'DBS 448-42347-6', 5.90, 57.70, 750.00),
('1022', 'Mxxxx003Q', 'Pulendran Prakash', 'Electrician', '2025-02-04', 'DBS 449-12803-6', 5.51, 53.84, 700.00),
('1024', 'Gxxxx581M', 'Balakrishnan Sathiyamoorthy', 'Construction Worker', '2025-02-24', 'DBS 446-01206-1', 5.32, 52.00, 676.00),
('1025', 'Gxxxx22W', 'Chelladurai Chinraj', 'Construction Worker', '2025-03-04', 'DBS 426-28623-8', 5.11, 50.00, 650.00),
('1026', 'Mxxxx323J', 'Rajaram Arunprakash', 'Construction Worker', '2025-03-16', 'DBS 450-59764-3', 4.92, 48.08, 625.00),
('1027', 'G88xxx02T', 'Karuppaiah Velmurugan', 'Con''s Worker', '2025-05-05', 'DBS 455-746434-4', 4.91, 48.00, 624.00),
('1029', 'Gxxxx714X', 'Murugesan Rasalingam', 'Electrician', '2025-06-04', 'DBS 445-94531-5', 5.74, 56.00, 730.00),
('1030', 'Gxxxx284N', 'Govindhan Muruganantham', 'Construction Worker', '2025-06-23', 'DBS 426-07435-4', 6.29, 61.54, 800.00),
('1031', 'GXXX093P', 'Elangovan Sathish', 'Electrician', '2025-06-30', 'DBS 448-72464-6', 5.90, 57.70, 750.00),
('1032', 'Mxxxx645W', 'Ganesan Sangilimuthu', 'Construction Worker', '2025-06-30', 'DBS 443-95619-0', 4.92, 48.00, 625.00),
('1033', 'Gxxxx088Q', 'A A Johnson Jackab', 'Excavating Machine Operator', '2025-07-26', 'DBS 443-76456-9', 7.87, 76.92, 1000.00),
('1035', 'Gxxxx961W', 'Gopal Kabilan', 'Supervisor & General Foremen', '2025-07-20', 'DBS 456-33467-9', 5.98, 58.46, 760.00),
('1037', 'Mxxxx371P', 'Elangovan Rajarajan', 'Construction Worker', '2025-07-28', 'DBS 448-86707-2', 4.92, 48.00, 625.00),
('1038', 'Gxxxx712Q', 'Muthukrishnan Vembarasan', 'Construction Worker', '2025-08-02', 'DBS 451-85412-7', 5.11, 50.00, 650.00),
('1039', 'Gxxxx613L', 'Nath Sree Upendra', 'Excavating Machine Operator', '2025-08-21', 'DBS 424-78975-5', 5.51, 53.84, 700.00),
('1040', 'Gxxx754P', 'Alagarsamy Jayakumar', 'Construction Worker', '2025-08-10', 'DBS 452-32767-8', 5.35, 52.30, 680.00),
('1041', 'Gxxx497K', 'Mani Raja', 'Construction Worker cum Driver', '2025-08-12', 'SC 0105955558', 7.87, 76.92, 1000.00),
('1042', 'Gxxxx174Q', 'Apu Apu Sarwar', 'Construction Lorry Driver', '2025-08-08', 'DBS 450-11103-1', 10.00, 80.00, 1270.00),
('1043', 'Gxxxx580K', 'Arumugam Muthuchamy', 'Supervisor & General Foremen', '2025-08-15', 'DBS 449-38242-0', 7.87, 76.92, 1000.00),
('1047', 'Mxxxx292L', 'Gunasekaran Bharathi', 'Electrical Engineer', '2025-08-16', 'DBS 272-641329-6', 6.00, 50.00, 800.00),
('1048', 'Gxxxx945M', 'Karuppiah Sureshkumar', 'Construction Lorry Driver', '2025-09-02', 'DBS 402-64097-9', 10.00, 80.00, 1270.00),
('1049', 'Fxxxx546U', 'Venu Vijayakumar', 'Con''s Heavy Truck Driver', '2025-09-02', 'DBS 357-09778-9', 10.00, 80.00, 1270.00),
('1050', 'Mxxxx678T', 'A P Subashchandrabose', 'Construction Worker', '2025-10-02', 'DBS 450-84309-1', 5.31, 51.92, 675.00),
('1052', 'Mxxxx762U', 'Pugalenthi Akash', 'Construction Worker', '2025-10-30', 'DBS 450-84309-1', 4.50, 44.00, 572.00);

*/

/*

-- MIGRATION: Rename Lunch to Breaks and Add Multiple Breaks Support
-- Run this SQL in Supabase SQL Editor to migrate existing data

-- Step 1: Create breaks table for multiple breaks per shift
CREATE TABLE breaks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  shift_id UUID NOT NULL REFERENCES shifts(id) ON DELETE CASCADE,
  break_start TIMESTAMP WITH TIME ZONE NOT NULL,
  break_end TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Step 2: Migrate existing lunch data to breaks table
INSERT INTO breaks (shift_id, break_start, break_end)
SELECT id, lunch_start, lunch_end
FROM shifts
WHERE lunch_start IS NOT NULL;

-- Step 3: Add leave_type column to shifts table
ALTER TABLE shifts ADD COLUMN leave_type TEXT CHECK (leave_type IN ('AL', 'MC', 'UNPAID_LEAVE'));

-- Step 4: Create index for leave queries
CREATE INDEX idx_shifts_leave_type ON shifts(leave_type);
CREATE INDEX idx_shifts_work_date_worker_id ON shifts(work_date, worker_id);

-- Step 5: Enable RLS on breaks table
ALTER TABLE breaks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "breaks_select_policy" ON breaks FOR SELECT USING (true);
CREATE POLICY "breaks_insert_policy" ON breaks FOR INSERT WITH CHECK (true);
CREATE POLICY "breaks_update_policy" ON breaks FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "breaks_delete_policy" ON breaks FOR DELETE USING (true);

-- Step 6: Update worker_details to include leave balances
ALTER TABLE worker_details
ADD COLUMN annual_leave_balance INTEGER DEFAULT 14,
ADD COLUMN medical_leave_balance INTEGER DEFAULT 14;

-- Update existing workers with default leave balances
UPDATE worker_details SET annual_leave_balance = 14, medical_leave_balance = 14;

-- Step 7: Add leave balance tracking to leave_requests
ALTER TABLE leave_requests ADD COLUMN days_requested INTEGER;

-- Update existing leave requests with calculated days
UPDATE leave_requests SET days_requested = DATE_PART('day', to_date - from_date + 1);

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
