-- First, let's check what allowance columns actually exist in both tables
SELECT 
    table_name,
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name IN ('worker_details', 'local_worker_details') 
    AND (column_name LIKE '%allowance%' OR column_name LIKE '%basic%')
ORDER BY table_name, column_name;

-- Then we'll rename only the columns that actually exist
-- For worker_details table (Foreign Workers)
-- ALTER TABLE worker_details RENAME COLUMN basic_allowance_1 TO monthly_allowance;

-- For local_worker_details table (Local Workers) - check what the actual column name is first
-- ALTER TABLE local_worker_details RENAME COLUMN ??? TO monthly_allowance;
