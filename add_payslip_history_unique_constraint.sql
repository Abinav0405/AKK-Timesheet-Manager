-- Add unique constraint to payslip_history table to support upsert operations
-- This ensures no duplicate payslips for the same worker in the same month/year

ALTER TABLE payslip_history
ADD CONSTRAINT payslip_history_worker_month_year_unique
UNIQUE (worker_id, payslip_month, payslip_year);
