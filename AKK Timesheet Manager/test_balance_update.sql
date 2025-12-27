-- TEST LEAVE BALANCE UPDATE
-- Run this in Supabase SQL Editor to test if leave balance updates work

-- First, check current balance
SELECT employee_id, employee_name, annual_leave_balance, medical_leave_balance
FROM worker_details
WHERE employee_id = '1006';

-- Test update annual leave balance
UPDATE worker_details
SET annual_leave_balance = 5
WHERE employee_id = '1006';

-- Check if update worked
SELECT employee_id, employee_name, annual_leave_balance, medical_leave_balance
FROM worker_details
WHERE employee_id = '1006';

-- Reset back to 10
UPDATE worker_details
SET annual_leave_balance = 10
WHERE employee_id = '1006';
