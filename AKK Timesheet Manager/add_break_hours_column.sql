-- Migration: Add break_hours column to shifts table
-- Run this in Supabase SQL Editor to add the break_hours column

-- Add break_hours column to shifts table
ALTER TABLE shifts ADD COLUMN IF NOT EXISTS break_hours NUMERIC(5,2) DEFAULT 0;

-- Update existing records to calculate break hours from lunch_start and lunch_end if they exist
-- This will set break_hours for existing shifts that have lunch times
UPDATE shifts
SET break_hours = EXTRACT(EPOCH FROM (lunch_end - lunch_start)) / 3600
WHERE lunch_start IS NOT NULL AND lunch_end IS NOT NULL AND break_hours = 0;

-- Comment explaining the new column
COMMENT ON COLUMN shifts.break_hours IS 'Total break hours in decimal format (e.g., 1.5 for 1.5 hours). Used instead of calculating from lunch_start/lunch_end for better flexibility.';
