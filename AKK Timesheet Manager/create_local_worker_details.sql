-- Create local_worker_details table for Singapore local workers
-- Includes CPF, SINDA, and employer contribution tracking

CREATE TABLE local_worker_details (
    employee_id VARCHAR PRIMARY KEY,
    nric_fin VARCHAR,
    employee_name VARCHAR NOT NULL,
    designation VARCHAR,
    date_joined DATE,
    bank_account_number VARCHAR,
    ot_rate_per_hour DECIMAL(10,2) DEFAULT 0,
    sun_ph_rate_per_day DECIMAL(10,2) DEFAULT 0,
    basic_salary_per_day DECIMAL(10,2) DEFAULT 0,
    basic_allowance_1 DECIMAL(10,2) DEFAULT 150.00,
    password_hash VARCHAR,
    annual_leave_balance DECIMAL(5,2) DEFAULT 10,
    medical_leave_balance DECIMAL(5,2) DEFAULT 14,
    annual_leave_limit DECIMAL(5,2) DEFAULT 10,
    medical_leave_limit DECIMAL(5,2) DEFAULT 14,

    -- Additional columns for local workers
    cpf_employee_contribution DECIMAL(5,2), -- Percentage (e.g., 20.00 for 20%)
    cpf_employer_contribution DECIMAL(5,2), -- Percentage (e.g., 17.00 for 17%)
    sinda_contribution DECIMAL(10,2), -- Fixed monthly amount
    employer_salary DECIMAL(10,2), -- Monthly employer salary for CPF calculations
    birthday DATE
);

-- RLS Policies for local_worker_details (same as worker_details)
CREATE POLICY "local_worker_details_select_policy" ON local_worker_details
    FOR SELECT USING (true);

CREATE POLICY "local_worker_details_insert_policy" ON local_worker_details
    FOR INSERT WITH CHECK (true);

CREATE POLICY "local_worker_details_update_policy" ON local_worker_details
    FOR UPDATE USING (true) WITH CHECK (true);

CREATE POLICY "local_worker_details_delete_policy" ON local_worker_details
    FOR DELETE USING (true);

-- Add comment for documentation
COMMENT ON TABLE local_worker_details IS 'Worker details for Singapore local workers with CPF and SINDA tracking';
COMMENT ON COLUMN local_worker_details.cpf_employee_contribution IS 'CPF employee contribution percentage based on age';
COMMENT ON COLUMN local_worker_details.cpf_employer_contribution IS 'CPF employer contribution percentage based on age';
COMMENT ON COLUMN local_worker_details.sinda_contribution IS 'Fixed monthly SINDA contribution amount';
COMMENT ON COLUMN local_worker_details.employer_salary IS 'Monthly employer salary used for CPF employer contribution calculations';
COMMENT ON COLUMN local_worker_details.birthday IS 'Date of birth for age-based CPF rate calculations';
