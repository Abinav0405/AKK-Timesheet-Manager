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
    '2025-12-15T12:00:00Z', -- Entry time: 8:00 PM Singapore time (12:00 UTC)
    '2025-12-15T12:30:00Z', -- Lunch start: 8:30 PM Singapore time (12:30 UTC)
    '2025-12-15T13:30:00Z', -- Lunch end: 9:30 PM Singapore time (13:30 UTC)
    '2025-12-16T00:00:00Z', -- Leave time: 8:00 AM Singapore time (00:00 UTC)
    true, -- has_left
    8.0, -- worked_hours (8 hours basic)
    0.0,  -- sunday_hours
    3.0   -- ot_hours (11 worked hours - 8 basic = 3 OT)
);

-- Expected calculation breakdown:
-- Entry: 2025-12-15 20:00 Singapore time (8:00 PM)
-- Lunch: 2025-12-15 20:30 to 21:30 Singapore time (1 hour break)
-- Exit: 2025-12-16 08:00 Singapore time (8:00 AM)
--
-- Total time: 12 hours (from 8 PM to 8 AM next day)
-- Break: 1 hour
-- Actual worked time: 11 hours
-- Basic hours: 8 hours (assuming standard workday)
-- OT hours: 3 hours (11 worked - 8 basic = 3 OT)

-- Note: The calculateShiftHours function will recalculate these values when the shift is displayed
