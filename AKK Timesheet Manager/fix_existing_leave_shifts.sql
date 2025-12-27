-- FIX EXISTING APPROVED LEAVES - CREATE MISSING SHIFT RECORDS
-- Run this in Supabase SQL Editor to create leave shift records for already approved leaves

-- Step 1: Delete work shifts that conflict with approved leave dates
DELETE FROM shifts
WHERE worker_id IN (
    SELECT DISTINCT employee_id
    FROM leave_requests
    WHERE status = 'approved'
)
AND work_date IN (
    SELECT DISTINCT
        generate_series(
            from_date::date,
            to_date::date,
            '1 day'::interval
        )::date
    FROM leave_requests
    WHERE status = 'approved'
)
AND leave_type IS NULL; -- Only delete work shifts, not existing leave shifts

-- Step 2: Insert leave shift records for approved leaves
INSERT INTO shifts (
    worker_id,
    work_date,
    entry_time,
    leave_time,
    has_left,
    worked_hours,
    sunday_hours,
    ot_hours,
    leave_type,
    site_id
)
SELECT
    lr.employee_id,
    dates.work_date,
    CASE
        WHEN lr.leave_duration = 'half_day_morning' THEN dates.work_date + interval '0 hours'
        WHEN lr.leave_duration = 'half_day_afternoon' THEN dates.work_date + interval '12 hours'
        ELSE dates.work_date + interval '0 hours'
    END as entry_time,
    CASE
        WHEN lr.leave_duration = 'half_day_morning' THEN dates.work_date + interval '12 hours'
        WHEN lr.leave_duration = 'half_day_afternoon' THEN dates.work_date + interval '16 hours'
        ELSE dates.work_date + interval '8 hours'
    END as leave_time,
    true as has_left,
    CASE
        WHEN lr.leave_duration IN ('half_day_morning', 'half_day_afternoon') THEN
            CASE
                WHEN lr.leave_type IN ('Annual Leave', 'Maternity Leave', 'Paternity Leave', 'Shared Parental Leave', 'Childcare Leave', 'Sick Leave & Hospitalisation Leave', 'National Service (NS) Leave', 'Adoption Leave', 'Non-Statutory Leave (Employer Provided)', 'Compassionate / Bereavement Leave', 'Marriage Leave', 'Study / Exam Leave', 'Birthday Leave', 'Mental Health Day', 'Volunteer Leave')
                THEN 4 -- Half day paid leave
                ELSE 0 -- Half day unpaid leave
            END
        ELSE
            CASE
                WHEN lr.leave_type IN ('Annual Leave', 'Maternity Leave', 'Paternity Leave', 'Shared Parental Leave', 'Childcare Leave', 'Sick Leave & Hospitalisation Leave', 'National Service (NS) Leave', 'Adoption Leave', 'Non-Statutory Leave (Employer Provided)', 'Compassionate / Bereavement Leave', 'Marriage Leave', 'Study / Exam Leave', 'Birthday Leave', 'Mental Health Day', 'Volunteer Leave')
                THEN CASE
                    WHEN EXTRACT(DOW FROM dates.work_date) = 0 THEN 0 -- Sunday - 0 basic hours (no work on Sunday)
                    ELSE 8 -- Full day paid leave
                END
                ELSE 0 -- Full day unpaid leave
            END
    END as worked_hours,
    CASE
        WHEN lr.leave_duration IN ('half_day_morning', 'half_day_afternoon') THEN 0
        WHEN lr.leave_type IN ('Annual Leave', 'Maternity Leave', 'Paternity Leave', 'Shared Parental Leave', 'Childcare Leave', 'Sick Leave & Hospitalisation Leave', 'National Service (NS) Leave', 'Adoption Leave', 'Non-Statutory Leave (Employer Provided)', 'Compassionate / Bereavement Leave', 'Marriage Leave', 'Study / Exam Leave', 'Birthday Leave', 'Mental Health Day', 'Volunteer Leave')
        AND EXTRACT(DOW FROM dates.work_date) = 0 THEN 0 -- Sunday - no pay on leave
        ELSE 0
    END as sunday_hours,
    0 as ot_hours, -- No OT on leave days
    CASE
        WHEN lr.leave_duration = 'half_day_morning' AND lr.leave_type != 'Unpaid Leave' THEN lr.leave_type || '_HALF_MORNING'
        WHEN lr.leave_duration = 'half_day_afternoon' AND lr.leave_type != 'Unpaid Leave' THEN lr.leave_type || '_HALF_AFTERNOON'
        ELSE lr.leave_type
    END as leave_type,
    NULL as site_id -- No site for leave days
FROM leave_requests lr
CROSS JOIN LATERAL generate_series(lr.from_date::date, lr.to_date::date, '1 day'::interval) AS dates(work_date)
WHERE lr.status = 'approved'
AND NOT EXISTS (
    -- Don't create duplicate shift records
    SELECT 1 FROM shifts s
    WHERE s.worker_id = lr.employee_id
    AND s.work_date = dates.work_date
    AND s.leave_type IS NOT NULL
);

-- Step 3: Verify the fixes
SELECT
    'Leave Shifts Created' as status,
    COUNT(*) as count
FROM shifts
WHERE leave_type IS NOT NULL
AND work_date >= CURRENT_DATE - INTERVAL '30 days';

SELECT
    'Work Shifts Remaining' as status,
    COUNT(*) as count
FROM shifts
WHERE leave_type IS NULL
AND work_date >= CURRENT_DATE - INTERVAL '30 days';

-- Step 4: Show current leave balances
SELECT
    wd.employee_id,
    wd.employee_name,
    wd.annual_leave_balance,
    wd.medical_leave_balance,
    COUNT(lr.id) as approved_leaves
FROM worker_details wd
LEFT JOIN leave_requests lr ON wd.employee_id = lr.employee_id AND lr.status = 'approved'
WHERE wd.employee_id = '1006'
GROUP BY wd.employee_id, wd.employee_name, wd.annual_leave_balance, wd.medical_leave_balance;
