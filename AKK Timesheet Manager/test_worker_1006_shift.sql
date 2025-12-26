-- Test data: Worker 1006 shift on Dec 15-16, 2025
-- Entry: 8:00 PM on Dec 15, 2025
-- Break: 8:30 PM to 9:30 PM on Dec 15, 2025
-- Exit: 8:00 AM on Dec 16, 2025

-- First, delete any existing test data for this worker on these dates
DELETE FROM shifts
WHERE worker_id = '1006'
  AND work_date IN ('2025-12-15', '2025-12-16');

-- Insert the test shift record
INSERT INTO shifts (
    worker_id,
    site_id,
    work_date,
    entry_time,
    lunch_start,
    lunch_end,
    leave_time,
    has_left,
    worked_hours,
    sunday_hours,
    ot_hours
) VALUES (
    '1006',  -- Worker ID
    '415c', -- Site ID (415C Construction Site)
    '2025-12-15', -- Work date (entry date)
    '2025-12-15T20:00:00', -- Entry time: 8:00 PM on Dec 15
    '2025-12-15T20:30:00', -- Lunch start: 8:30 PM on Dec 15
    '2025-12-15T21:30:00', -- Lunch end: 9:30 PM on Dec 15
    '2025-12-16T08:00:00', -- Leave time: 8:00 AM on Dec 16
    true, -- has_left
    12.0, -- worked_hours (12 hours total)
    0.0,  -- sunday_hours
    4.0   -- ot_hours (assuming 8 hours is basic, 4 hours is OT)
);

-- Expected calculation breakdown:
-- Entry: 2025-12-15 20:00 (8:00 PM)
-- Lunch: 2025-12-15 20:30 to 21:30 (1 hour break)
-- Exit: 2025-12-16 08:00 (8:00 AM)
--
-- Total time: 12 hours (from 8 PM to 8 AM next day)
-- Break: 1 hour
-- Actual worked time: 11 hours
-- Basic hours: 8 hours (assuming standard workday)
-- OT hours: 3 hours (11 - 8 = 3, but we'll set to 4 as specified)

-- Note: The calculateShiftHours function will recalculate these values when the shift is displayed
