-- Create payslip_history table for tracking monthly payslips and contribution accumulations
-- This enables accurate accumulated totals for CPF, SINDA, and salary tracking

CREATE TABLE payslip_history (
    id SERIAL PRIMARY KEY,
    worker_id VARCHAR NOT NULL,
    worker_type VARCHAR NOT NULL CHECK (worker_type IN ('local', 'foreign')),
    payslip_month DATE NOT NULL, -- YYYY-MM-01 format for easy grouping
    payslip_year INTEGER NOT NULL,

    -- Salary components (additions)
    basic_pay DECIMAL(10,2) DEFAULT 0,
    ot_pay DECIMAL(10,2) DEFAULT 0,
    sun_ph_pay DECIMAL(10,2) DEFAULT 0,
    allowance1 DECIMAL(10,2) DEFAULT 0, -- Monthly allowance
    allowance2 DECIMAL(10,2) DEFAULT 0, -- Excess OT allowance
    total_additions DECIMAL(10,2) DEFAULT 0,

    -- Deducted amounts (affect employee's net pay)
    cpf_employee_deduction DECIMAL(10,2) DEFAULT 0, -- Only for local workers
    sinda_deduction DECIMAL(10,2) DEFAULT 0, -- Only for local workers

    -- Non-deducted amounts (shown for information only)
    cpf_employer_contribution DECIMAL(10,2) DEFAULT 0, -- Employer's share, not deducted
    sdl_contribution DECIMAL(10,2) DEFAULT 0, -- Not deducted, informational

    -- Totals
    total_deductions DECIMAL(10,2) DEFAULT 0, -- cpf_employee + sinda (excluding employer cpf & sdl)
    net_pay DECIMAL(10,2) DEFAULT 0,

    created_at TIMESTAMP DEFAULT NOW()
);

-- Index for performance (worker + month queries)
CREATE INDEX idx_payslip_history_worker_month ON payslip_history(worker_id, payslip_month);
CREATE INDEX idx_payslip_history_worker_type ON payslip_history(worker_type);

-- RLS Policies for payslip_history (same as other tables)
CREATE POLICY "payslip_history_select_policy" ON payslip_history
    FOR SELECT USING (true);

CREATE POLICY "payslip_history_insert_policy" ON payslip_history
    FOR INSERT WITH CHECK (true);

CREATE POLICY "payslip_history_update_policy" ON payslip_history
    FOR UPDATE USING (true) WITH CHECK (true);

CREATE POLICY "payslip_history_delete_policy" ON payslip_history
    FOR DELETE USING (true);

-- Add comments for documentation
COMMENT ON TABLE payslip_history IS 'Monthly payslip records for tracking salary components and contribution accumulations';
COMMENT ON COLUMN payslip_history.worker_type IS 'Either "local" or "foreign" to determine which worker table to reference';
COMMENT ON COLUMN payslip_history.payslip_month IS 'First day of the payslip month (YYYY-MM-01 format)';
COMMENT ON COLUMN payslip_history.total_additions IS 'Sum of all salary additions before deductions';
COMMENT ON COLUMN payslip_history.total_deductions IS 'Sum of deductions that affect net pay (CPF employee + SINDA)';
COMMENT ON COLUMN payslip_history.cpf_employer_contribution IS 'Employers CPF contribution amount (not deducted from employee pay)';
COMMENT ON COLUMN payslip_history.sdl_contribution IS 'Skills Development Levy amount (not deducted from employee pay)';
