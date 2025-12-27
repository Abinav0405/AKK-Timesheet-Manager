-- Fix existing leave balances after Sunday exclusion logic
-- Run this in Supabase SQL Editor to recalculate balances for workers with approved leaves

-- First, let's see the current state
SELECT
    wd.employee_id,
    wd.employee_name,
    wd.annual_leave_balance as current_al_balance,
    wd.medical_leave_balance as current_mc_balance,
    COUNT(lr.id) as total_approved_leaves,
    SUM(CASE WHEN lr.leave_type = 'Annual Leave' THEN 1 ELSE 0 END) as al_requests,
    SUM(CASE WHEN lr.leave_type = 'Sick Leave & Hospitalisation Leave' THEN 1 ELSE 0 END) as mc_requests
FROM worker_details wd
LEFT JOIN leave_requests lr ON wd.employee_id = lr.employee_id AND lr.status = 'approved'
GROUP BY wd.employee_id, wd.employee_name, wd.annual_leave_balance, wd.medical_leave_balance
ORDER BY wd.employee_id;

-- Calculate correct balances excluding Sundays
WITH leave_calculations AS (
    SELECT
        lr.employee_id,
        lr.leave_type,
        lr.from_date,
        lr.to_date,
        lr.leave_duration,
        -- Count weekdays only (exclude Sundays) for paid leave
        CASE
            WHEN lr.leave_type IN ('Annual Leave', 'Sick Leave & Hospitalisation Leave') THEN
                -- Count weekdays in the date range
                (SELECT COUNT(*)
                 FROM generate_series(lr.from_date::date, lr.to_date::date, '1 day'::interval) AS d
                 WHERE EXTRACT(DOW FROM d) NOT IN (0) -- Exclude Sunday (0)
                ) * CASE WHEN lr.leave_duration LIKE '%half%' THEN 0.5 ELSE 1.0 END
            ELSE 0 -- Not a balance-deducting leave type
        END as days_used
    FROM leave_requests lr
    WHERE lr.status = 'approved'
    AND lr.leave_type IN ('Annual Leave', 'Sick Leave & Hospitalisation Leave')
),
worker_totals AS (
    SELECT
        employee_id,
        SUM(CASE WHEN leave_type = 'Annual Leave' THEN days_used ELSE 0 END) as total_al_used,
        SUM(CASE WHEN leave_type = 'Sick Leave & Hospitalisation Leave' THEN days_used ELSE 0 END) as total_mc_used
    FROM leave_calculations
    GROUP BY employee_id
)
-- Update balances: start with default limits and subtract used days
UPDATE worker_details
SET
    annual_leave_balance = GREATEST(0, (annual_leave_limit - COALESCE(wt.total_al_used, 0))),
    medical_leave_balance = GREATEST(0, (medical_leave_limit - COALESCE(wt.total_mc_used, 0)))
FROM worker_totals wt
WHERE worker_details.employee_id = wt.employee_id;

-- For workers with no approved leaves, reset to default limits
UPDATE worker_details
SET
    annual_leave_balance = annual_leave_limit,
    medical_leave_balance = medical_leave_limit
WHERE employee_id NOT IN (
    SELECT DISTINCT employee_id
    FROM leave_requests
    WHERE status = 'approved'
    AND leave_type IN ('Annual Leave', 'Sick Leave & Hospitalisation Leave')
);

-- Verify the results
SELECT
    wd.employee_id,
    wd.employee_name,
    wd.annual_leave_balance as corrected_al_balance,
    wd.medical_leave_balance as corrected_mc_balance,
    wd.annual_leave_limit,
    wd.medical_leave_limit
FROM worker_details wd
ORDER BY wd.employee_id;
