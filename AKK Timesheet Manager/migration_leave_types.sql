-- MIGRATION: Update leave types and add leave limits
-- Run this SQL in Supabase SQL Editor to update the database

-- Step 1: Convert existing leave types to new format first
UPDATE leave_requests SET leave_type = 'Annual Leave' WHERE leave_type = 'AL';
UPDATE leave_requests SET leave_type = 'Sick Leave & Hospitalisation Leave' WHERE leave_type = 'MC';

-- Step 2: Clear all existing leave requests with old leave types (backup first!)
-- WARNING: This will delete existing leave data - make sure you have a backup!

-- Option 1: Delete all existing leave requests (clean slate approach)
-- DELETE FROM leave_requests WHERE leave_type NOT IN ('Annual Leave', 'Maternity Leave', 'Paternity Leave', 'Shared Parental Leave', 'Childcare Leave', 'Sick Leave & Hospitalisation Leave', 'National Service (NS) Leave', 'Adoption Leave', 'Non-Statutory Leave (Employer Provided)', 'Compassionate / Bereavement Leave', 'Marriage Leave', 'Study / Exam Leave', 'Birthday Leave', 'Mental Health Day', 'Volunteer Leave', 'Unpaid Leave');

-- Option 2: Keep existing data but force update constraint (if above doesn't work)
-- This will try to drop and recreate the constraint regardless
DO $$
BEGIN
    -- Try to drop constraint, ignore if it doesn't exist
    BEGIN
        ALTER TABLE leave_requests DROP CONSTRAINT leave_requests_leave_type_check;
        RAISE NOTICE 'Dropped existing constraint';
    EXCEPTION
        WHEN undefined_object THEN
            RAISE NOTICE 'Constraint did not exist, continuing...';
    END;

    -- Add the new constraint
    ALTER TABLE leave_requests ADD CONSTRAINT leave_requests_leave_type_check CHECK (leave_type IN (
        'Annual Leave', 'Maternity Leave', 'Paternity Leave', 'Shared Parental Leave',
        'Childcare Leave', 'Sick Leave & Hospitalisation Leave', 'National Service (NS) Leave',
        'Adoption Leave', 'Non-Statutory Leave (Employer Provided)', 'Compassionate / Bereavement Leave',
        'Marriage Leave', 'Study / Exam Leave', 'Birthday Leave', 'Mental Health Day',
        'Volunteer Leave', 'Unpaid Leave'
    ));

    RAISE NOTICE 'Added new constraint successfully';
END $$;

-- Step 4: Update shifts table to support expanded leave types
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
