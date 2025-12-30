-- Check worker_details table structure (Foreign Workers)
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'worker_details' 
ORDER BY ordinal_position;

-- Check local_worker_details table structure (Local Workers)
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'local_worker_details' 
ORDER BY ordinal_position;

-- Compare columns between the two tables
SELECT 
    w.column_name,
    w.data_type as worker_details_type,
    l.data_type as local_worker_details_type,
    CASE 
        WHEN w.column_name IS NULL THEN 'Only in local_worker_details'
        WHEN l.column_name IS NULL THEN 'Only in worker_details'
        ELSE 'Both tables'
    END as table_presence
FROM (
    SELECT column_name, data_type FROM information_schema.columns 
    WHERE table_name = 'worker_details'
) w
FULL OUTER JOIN (
    SELECT column_name, data_type FROM information_schema.columns 
    WHERE table_name = 'local_worker_details'
) l ON w.column_name = l.column_name
ORDER BY w.column_name;
