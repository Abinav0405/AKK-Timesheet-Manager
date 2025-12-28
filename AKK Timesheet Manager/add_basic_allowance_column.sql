-- Add basic_allowance_1 column to worker_details table
ALTER TABLE worker_details ADD COLUMN IF NOT EXISTS basic_allowance_1 DECIMAL(10,2) DEFAULT 150.00;

-- Update existing workers to have the default value
UPDATE worker_details SET basic_allowance_1 = 150.00 WHERE basic_allowance_1 IS NULL;
