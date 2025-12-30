-- SQL script to insert shift data for worker 1029 for November 2025
-- Assuming timezone is Asia/Singapore (UTC+8)
-- Lunch breaks are calculated as starting 4 hours after entry_time and lasting for break_hours duration

INSERT INTO shifts (worker_id, site_id, work_date, entry_time, leave_time, lunch_start, lunch_end, break_hours, has_left) VALUES
('1029', NULL, '2025-11-01', '2025-11-01 07:00:00+08'::timestamptz, '2025-11-01 17:00:00+08'::timestamptz, '2025-11-01 11:00:00+08'::timestamptz, '2025-11-01 12:00:00+08'::timestamptz, 1.0, true),
('1029', NULL, '2025-11-03', '2025-11-03 07:00:00+08'::timestamptz, '2025-11-03 19:00:00+08'::timestamptz, '2025-11-03 11:00:00+08'::timestamptz, '2025-11-03 12:00:00+08'::timestamptz, 1.0, true),
('1029', NULL, '2025-11-04', '2025-11-04 07:00:00+08'::timestamptz, '2025-11-04 19:00:00+08'::timestamptz, '2025-11-04 11:00:00+08'::timestamptz, '2025-11-04 12:00:00+08'::timestamptz, 1.0, true),
('1029', NULL, '2025-11-05', '2025-11-05 07:00:00+08'::timestamptz, '2025-11-05 19:00:00+08'::timestamptz, '2025-11-05 11:00:00+08'::timestamptz, '2025-11-05 12:00:00+08'::timestamptz, 1.0, true),
('1029', NULL, '2025-11-06', '2025-11-06 07:00:00+08'::timestamptz, '2025-11-06 18:00:00+08'::timestamptz, '2025-11-06 11:00:00+08'::timestamptz, '2025-11-06 12:00:00+08'::timestamptz, 1.0, true),
('1029', NULL, '2025-11-07', '2025-11-07 07:00:00+08'::timestamptz, '2025-11-07 16:00:00+08'::timestamptz, '2025-11-07 11:00:00+08'::timestamptz, '2025-11-07 12:00:00+08'::timestamptz, 1.0, true),
('1029', NULL, '2025-11-08', '2025-11-08 07:00:00+08'::timestamptz, '2025-11-08 18:00:00+08'::timestamptz, '2025-11-08 11:00:00+08'::timestamptz, '2025-11-08 12:00:00+08'::timestamptz, 1.0, true),
('1029', NULL, '2025-11-10', '2025-11-10 15:00:00+08'::timestamptz, '2025-11-11 00:00:00+08'::timestamptz, '2025-11-10 19:00:00+08'::timestamptz, '2025-11-10 20:00:00+08'::timestamptz, 1.0, true),
('1029', NULL, '2025-11-11', '2025-11-11 15:00:00+08'::timestamptz, '2025-11-12 00:00:00+08'::timestamptz, '2025-11-11 19:00:00+08'::timestamptz, '2025-11-11 20:00:00+08'::timestamptz, 1.0, true),
('1029', NULL, '2025-11-12', '2025-11-12 15:00:00+08'::timestamptz, '2025-11-13 00:00:00+08'::timestamptz, '2025-11-12 19:00:00+08'::timestamptz, '2025-11-12 20:00:00+08'::timestamptz, 1.0, true),
('1029', NULL, '2025-11-13', '2025-11-13 15:00:00+08'::timestamptz, '2025-11-14 00:00:00+08'::timestamptz, '2025-11-13 19:00:00+08'::timestamptz, '2025-11-13 20:00:00+08'::timestamptz, 1.0, true),
('1029', NULL, '2025-11-14', '2025-11-14 15:00:00+08'::timestamptz, '2025-11-15 00:00:00+08'::timestamptz, '2025-11-14 19:00:00+08'::timestamptz, '2025-11-14 20:00:00+08'::timestamptz, 1.0, true),
('1029', NULL, '2025-11-15', '2025-11-15 15:00:00+08'::timestamptz, '2025-11-16 00:00:00+08'::timestamptz, '2025-11-15 19:00:00+08'::timestamptz, '2025-11-15 20:00:00+08'::timestamptz, 1.0, true),
('1029', NULL, '2025-11-16', '2025-11-16 15:00:00+08'::timestamptz, '2025-11-17 00:00:00+08'::timestamptz, '2025-11-16 19:00:00+08'::timestamptz, '2025-11-16 20:00:00+08'::timestamptz, 1.0, true),
('1029', NULL, '2025-11-17', '2025-11-17 07:00:00+08'::timestamptz, '2025-11-17 16:00:00+08'::timestamptz, '2025-11-17 11:00:00+08'::timestamptz, '2025-11-17 12:00:00+08'::timestamptz, 1.0, true),
('1029', NULL, '2025-11-18', '2025-11-18 07:00:00+08'::timestamptz, '2025-11-18 19:00:00+08'::timestamptz, '2025-11-18 11:00:00+08'::timestamptz, '2025-11-18 12:00:00+08'::timestamptz, 1.0, true),
('1029', NULL, '2025-11-19', '2025-11-19 07:00:00+08'::timestamptz, '2025-11-19 16:00:00+08'::timestamptz, '2025-11-19 11:00:00+08'::timestamptz, '2025-11-19 12:00:00+08'::timestamptz, 1.0, true),
('1029', NULL, '2025-11-20', '2025-11-20 07:00:00+08'::timestamptz, '2025-11-20 18:00:00+08'::timestamptz, '2025-11-20 11:00:00+08'::timestamptz, '2025-11-20 12:00:00+08'::timestamptz, 1.0, true),
('1029', NULL, '2025-11-21', '2025-11-21 07:00:00+08'::timestamptz, '2025-11-21 20:00:00+08'::timestamptz, '2025-11-21 11:00:00+08'::timestamptz, '2025-11-21 12:00:00+08'::timestamptz, 1.0, true),
('1029', NULL, '2025-11-22', '2025-11-22 07:00:00+08'::timestamptz, '2025-11-22 00:00:00+08'::timestamptz, '2025-11-22 11:00:00+08'::timestamptz, '2025-11-22 13:00:00+08'::timestamptz, 2.0, true),
('1029', NULL, '2025-11-23', '2025-11-23 07:00:00+08'::timestamptz, '2025-11-23 16:00:00+08'::timestamptz, '2025-11-23 11:00:00+08'::timestamptz, '2025-11-23 12:00:00+08'::timestamptz, 1.0, true),
('1029', NULL, '2025-11-24', '2025-11-24 07:00:00+08'::timestamptz, '2025-11-24 16:00:00+08'::timestamptz, '2025-11-24 11:00:00+08'::timestamptz, '2025-11-24 12:00:00+08'::timestamptz, 1.0, true),
('1029', NULL, '2025-11-25', '2025-11-25 07:00:00+08'::timestamptz, '2025-11-25 18:00:00+08'::timestamptz, '2025-11-25 11:00:00+08'::timestamptz, '2025-11-25 12:00:00+08'::timestamptz, 1.0, true),
('1029', NULL, '2025-11-26', '2025-11-26 07:00:00+08'::timestamptz, '2025-11-26 19:00:00+08'::timestamptz, '2025-11-26 11:00:00+08'::timestamptz, '2025-11-26 12:00:00+08'::timestamptz, 1.0, true),
('1029', NULL, '2025-11-27', '2025-11-27 07:00:00+08'::timestamptz, '2025-11-27 16:00:00+08'::timestamptz, '2025-11-27 11:00:00+08'::timestamptz, '2025-11-27 12:00:00+08'::timestamptz, 1.0, true),
('1029', NULL, '2025-11-28', '2025-11-28 07:00:00+08'::timestamptz, '2025-11-28 16:00:00+08'::timestamptz, '2025-11-28 11:00:00+08'::timestamptz, '2025-11-28 12:00:00+08'::timestamptz, 1.0, true),
('1029', NULL, '2025-11-29', '2025-11-29 08:00:00+08'::timestamptz, '2025-11-29 20:00:00+08'::timestamptz, '2025-11-29 12:00:00+08'::timestamptz, '2025-11-29 13:00:00+08'::timestamptz, 1.0, true),
('1029', NULL, '2025-11-30', '2025-11-30 08:00:00+08'::timestamptz, '2025-11-30 20:00:00+08'::timestamptz, '2025-11-30 12:00:00+08'::timestamptz, '2025-11-30 13:00:00+08'::timestamptz, 1.0, true);
