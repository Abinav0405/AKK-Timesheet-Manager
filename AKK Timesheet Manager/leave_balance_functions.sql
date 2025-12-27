-- LEAVE BALANCE FUNCTIONS
-- Run this in Supabase SQL Editor to create functions for leave balance management

-- Function to safely update leave balance (deduct)
CREATE OR REPLACE FUNCTION update_leave_balance(worker_id_param TEXT, balance_type_param TEXT, deduction_param NUMERIC)
RETURNS VOID AS $$
DECLARE
    current_balance NUMERIC;
BEGIN
    -- Get current balance
    IF balance_type_param = 'annual' THEN
        SELECT annual_leave_balance INTO current_balance
        FROM worker_details WHERE employee_id = worker_id_param;
    ELSIF balance_type_param = 'medical' THEN
        SELECT medical_leave_balance INTO current_balance
        FROM worker_details WHERE employee_id = worker_id_param;
    END IF;

    -- Update with deduction (prevent negative)
    IF balance_type_param = 'annual' THEN
        UPDATE worker_details
        SET annual_leave_balance = GREATEST(0, COALESCE(current_balance, 10) - deduction_param)
        WHERE employee_id = worker_id_param;
    ELSIF balance_type_param = 'medical' THEN
        UPDATE worker_details
        SET medical_leave_balance = GREATEST(0, COALESCE(current_balance, 14) - deduction_param)
        WHERE employee_id = worker_id_param;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Function to restore leave balance (add)
CREATE OR REPLACE FUNCTION restore_leave_balance(worker_id_param TEXT, balance_type_param TEXT, addition_param NUMERIC)
RETURNS VOID AS $$
DECLARE
    current_balance NUMERIC;
BEGIN
    -- Get current balance
    IF balance_type_param = 'annual' THEN
        SELECT annual_leave_balance INTO current_balance
        FROM worker_details WHERE employee_id = worker_id_param;
    ELSIF balance_type_param = 'medical' THEN
        SELECT medical_leave_balance INTO current_balance
        FROM worker_details WHERE employee_id = worker_id_param;
    END IF;

    -- Update with addition
    IF balance_type_param = 'annual' THEN
        UPDATE worker_details
        SET annual_leave_balance = COALESCE(current_balance, 10) + addition_param
        WHERE employee_id = worker_id_param;
    ELSIF balance_type_param = 'medical' THEN
        UPDATE worker_details
        SET medical_leave_balance = COALESCE(current_balance, 14) + addition_param
        WHERE employee_id = worker_id_param;
    END IF;
END;
$$ LANGUAGE plpgsql;
