-- Check the actual column names in the shifts table
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'shifts' 
ORDER BY ordinal_position;
