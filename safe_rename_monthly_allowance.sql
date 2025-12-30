-- Safe column rename script - only renames columns that actually exist

-- Step 1: Check if basic_allowance_1 exists in worker_details and rename it
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'worker_details' 
        AND column_name = 'basic_allowance_1'
    ) THEN
        ALTER TABLE worker_details RENAME COLUMN basic_allowance_1 TO monthly_allowance;
        RAISE NOTICE 'Renamed basic_allowance_1 to monthly_allowance in worker_details table';
    ELSE
        RAISE NOTICE 'basic_allowance_1 does not exist in worker_details table';
    END IF;
END $$;

-- Step 2: Check if basic_allowance_1 exists in local_worker_details and rename it
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'local_worker_details' 
        AND column_name = 'basic_allowance_1'
    ) THEN
        ALTER TABLE local_worker_details RENAME COLUMN basic_allowance_1 TO monthly_allowance;
        RAISE NOTICE 'Renamed basic_allowance_1 to monthly_allowance in local_worker_details table';
    ELSE
        RAISE NOTICE 'basic_allowance_1 does not exist in local_worker_details table';
    END IF;
END $$;

-- Step 3: Verify the changes
SELECT 
    table_name,
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name IN ('worker_details', 'local_worker_details') 
    AND column_name = 'monthly_allowance'
ORDER BY table_name;
