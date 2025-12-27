-- WORKING MIGRATION: Simple and effective
-- Run this in Supabase SQL Editor - handles all data properly

-- Step 1: Convert existing data first
UPDATE leave_requests SET leave_type = 'Annual Leave' WHERE leave_type = 'AL';
UPDATE leave_requests SET leave_type = 'Sick Leave & Hospitalisation Leave' WHERE leave_type = 'MC';

UPDATE shifts SET leave_type = 'Annual Leave' WHERE leave_type = 'AL';
UPDATE shifts SET leave_type = 'Sick Leave & Hospitalisation Leave' WHERE leave_type = 'MC';
UPDATE shifts SET leave_type = 'Unpaid Leave' WHERE leave_type = 'UNPAID_LEAVE';

-- Step 2: Clean up any remaining invalid data
DELETE FROM leave_requests WHERE leave_type NOT IN (
    'Annual Leave', 'Maternity Leave', 'Paternity Leave', 'Shared Parental Leave',
    'Childcare Leave', 'Sick Leave & Hospitalisation Leave', 'National Service (NS) Leave',
    'Adoption Leave', 'Non-Statutory Leave (Employer Provided)', 'Compassionate / Bereavement Leave',
    'Marriage Leave', 'Study / Exam Leave', 'Birthday Leave', 'Mental Health Day',
    'Volunteer Leave', 'Unpaid Leave'
) AND leave_type IS NOT NULL;

DELETE FROM shifts WHERE leave_type IS NOT NULL AND leave_type NOT IN (
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
);

-- Step 3: Drop existing constraints (if they exist)
DO $$
BEGIN
    -- Try to drop constraints, ignore if they don't exist
    BEGIN
        ALTER TABLE leave_requests DROP CONSTRAINT leave_requests_leave_type_check;
        RAISE NOTICE 'Dropped leave_requests constraint';
    EXCEPTION
        WHEN undefined_object THEN
            RAISE NOTICE 'leave_requests constraint did not exist';
    END;

    BEGIN
        ALTER TABLE shifts DROP CONSTRAINT shifts_leave_type_check;
        RAISE NOTICE 'Dropped shifts constraint';
    EXCEPTION
        WHEN undefined_object THEN
            RAISE NOTICE 'shifts constraint did not exist';
    END;
END $$;

-- Step 4: Add new constraints
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

-- Step 5: Add leave limit fields
ALTER TABLE worker_details
ADD COLUMN IF NOT EXISTS annual_leave_limit INTEGER DEFAULT 10,
ADD COLUMN IF NOT EXISTS medical_leave_limit INTEGER DEFAULT 14;

UPDATE worker_details SET annual_leave_limit = 10, medical_leave_limit = 14 WHERE annual_leave_limit IS NULL;

-- Migration complete!
-- All features are now ready to use!
