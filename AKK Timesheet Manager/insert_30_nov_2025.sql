-- Fix 30/11/2025 shift
-- First delete any existing shifts for 30/11
DELETE FROM shifts WHERE worker_id = '1009' AND work_date = '2025-11-30';

-- Insert correct 30/11/2025 shift
INSERT INTO shifts (worker_id, work_date, entry_time, leave_time, has_left, worked_hours, sunday_hours, ot_hours, site_id) VALUES
('1009', '2025-11-30', '2025-11-30T20:00:00', '2025-12-01T08:00:00', true, 0, 11, 0, null);

-- Insert break for 30/11
INSERT INTO breaks (shift_id, break_start, break_end)
SELECT id, '2025-11-30T22:00:00', '2025-11-30T23:00:00'
FROM shifts WHERE worker_id = '1009' AND work_date = '2025-11-30';
