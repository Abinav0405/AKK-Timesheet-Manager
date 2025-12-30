-- Rename basic_allowance_1 to monthly_allowance in both worker tables
-- This will update the database schema to match the form field names

-- For worker_details table (Foreign Workers)
ALTER TABLE worker_details 
RENAME COLUMN basic_allowance_1 TO monthly_allowance;

-- For local_worker_details table (Local Workers) 
ALTER TABLE local_worker_details 
RENAME COLUMN basic_allowance_1 TO monthly_allowance;

-- Verify the changes
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name IN ('worker_details', 'local_worker_details') 
    AND column_name = 'monthly_allowance'
ORDER BY table_name;
