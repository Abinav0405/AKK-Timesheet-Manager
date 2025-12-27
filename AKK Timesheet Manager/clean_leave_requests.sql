-- CLEAN LEAVE REQUESTS BEFORE MIGRATION
-- Run this FIRST in Supabase SQL Editor to clean up problematic data

-- Delete the specific leave request causing constraint violations
DELETE FROM leave_requests WHERE id = '808e0420-4375-49e0-885d-1f81d6b40a3f';

-- Optional: Delete all leave requests if you want a clean slate
-- DELETE FROM leave_requests;

-- Check current constraints
SELECT conname, contype, conrelid::regclass, pg_get_constraintdef(oid)
FROM pg_constraint
WHERE conrelid = 'leave_requests'::regclass
AND contype = 'c'
AND conname LIKE '%leave_type%';
