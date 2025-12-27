-- NUCLEAR MIGRATION: Delete everything and start fresh
-- Run this ONLY if other migrations fail - this deletes all leave data

-- Step 1: Delete ALL existing leave requests and related data
DELETE FROM leave_requests;
DELETE FROM shifts WHERE leave_type IS NOT NULL;

-- Step 2: Drop ALL constraints related to leave_type
DO $$
DECLARE
    constraint_record RECORD;
BEGIN
    FOR constraint_record IN
        SELECT n.nspname as schemaname, c.conrelid::regclass::text as tablename, c.conname
        FROM pg_constraint c
        JOIN pg_namespace n ON c.connamespace = n.oid
        WHERE c.conname LIKE '%leave_type%'
        AND c.contype = 'c'
    LOOP
        EXECUTE 'ALTER TABLE ' || constraint_record.schemaname || '.' || constraint_record.tablename ||
                ' DROP CONSTRAINT ' || constraint_record.conname;
        RAISE NOTICE 'Dropped constraint: %', constraint_record.conname;
    END LOOP;
END $$;

-- Step 3: Add fresh constraints
ALTER TABLE leave_requests ADD CONSTRAINT leave_requests_leave_type_check CHECK (leave_type IN (
    'Annual Leave', 'Maternity Leave', 'Paternity Leave', 'Shared Parental Leave',
    'Childcare Leave', 'Sick Leave & Hospitalisation Leave', 'National Service (NS) Leave',
    'Adoption Leave', 'Non-Statutory Leave (Employer Provided)', 'Compassionate / Bereavement Leave',
    'Marriage Leave', 'Study / Exam Leave', 'Birthday Leave', 'Mental Health Day',
    'Volunteer Leave', 'Unpaid Leave'
));

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

-- Step 4: Add leave limit fields (as per requirements)
-- Note: Existing database has annual_leave_balance and medical_leave_balance
-- We need to add the limit fields as specified in requirements
ALTER TABLE worker_details
ADD COLUMN IF NOT EXISTS annual_leave_limit INTEGER DEFAULT 10,
ADD COLUMN IF NOT EXISTS medical_leave_limit INTEGER DEFAULT 14;

-- Update existing workers with correct default limits (10 for annual, 14 for medical)
UPDATE worker_details SET
    annual_leave_limit = 10,
    medical_leave_limit = 14
WHERE annual_leave_limit IS NULL OR annual_leave_limit = 0;

-- Ensure existing balance fields match the limits (as per requirements)
UPDATE worker_details SET
    annual_leave_balance = 10,
    medical_leave_balance = 14;

-- Nuclear migration complete!
-- All old leave data deleted, fresh constraints applied.
-- Ready for new leave requests!
