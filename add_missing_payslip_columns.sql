-- Add missing columns to payslip_history table
-- These columns are needed for the bulk payslip generation feature

ALTER TABLE payslip_history
ADD COLUMN IF NOT EXISTS incentive_allowance DECIMAL(10,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS monthly_allowance DECIMAL(10,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS allowance1 DECIMAL(10,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS allowance2 DECIMAL(10,2) DEFAULT 0;
