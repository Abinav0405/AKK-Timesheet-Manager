-- FIX EXISTING LEAVE BALANCES
-- Run this in Supabase SQL Editor to update balances for already approved leaves

-- Update worker 1006 balance (5 days annual leave already approved)
UPDATE worker_details
SET annual_leave_balance = 10 - 5
WHERE employee_id = '1006';

-- Verify the update
SELECT employee_id, employee_name, annual_leave_balance, medical_leave_balance
FROM worker_details
WHERE employee_id = '1006';

-- This will set annual leave balance to 5 (10 - 5 approved days)
