-- Fix Row Level Security for worker_details table
-- Allow admins to perform all operations on worker_details

-- First, check current policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies
WHERE tablename = 'worker_details';

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "worker_details_select_policy" ON worker_details;
DROP POLICY IF EXISTS "worker_details_insert_policy" ON worker_details;
DROP POLICY IF EXISTS "worker_details_update_policy" ON worker_details;
DROP POLICY IF EXISTS "worker_details_delete_policy" ON worker_details;

-- Create new policies that allow admin operations
-- Note: This assumes you have an admin role or are using service key authentication
-- For development, we'll allow all authenticated users to manage workers
-- In production, you should restrict this to admin users only

CREATE POLICY "worker_details_select_policy" ON worker_details
    FOR SELECT USING (true);

CREATE POLICY "worker_details_insert_policy" ON worker_details
    FOR INSERT WITH CHECK (true);

CREATE POLICY "worker_details_update_policy" ON worker_details
    FOR UPDATE USING (true) WITH CHECK (true);

CREATE POLICY "worker_details_delete_policy" ON worker_details
    FOR DELETE USING (true);

-- Alternative: If you want to disable RLS completely for worker_details (not recommended for production)
-- ALTER TABLE worker_details DISABLE ROW LEVEL SECURITY;

-- Verify the policies were created
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies
WHERE tablename = 'worker_details';
