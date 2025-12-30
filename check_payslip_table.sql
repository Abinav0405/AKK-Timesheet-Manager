-- Simple check to see current table structure
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'payslip_history' 
ORDER BY ordinal_position;

-- Check if RLS is enabled
SELECT relrowsecurity 
FROM pg_class 
WHERE relname = 'payslip_history';

-- Check existing RLS policies
SELECT 
    policyname, 
    permissive, 
    roles, 
    cmd, 
    qual
FROM pg_policies 
WHERE tablename = 'payslip_history';
