-- SQL script to insert shift data for worker 1025 for November 2025
-- Assuming timezone is Asia/Singapore (UTC+8)
-- Lunch breaks are calculated as starting 4 hours after entry_time and lasting for break_hours duration

INSERT INTO shifts (worker_id, site_id, work_date, entry_time, leave_time, lunch_start, lunch_end, break_hours, has_left) VALUES
('1025', NULL, '2025-11-01', '2025-11-01 20:00:00+08'::timestamptz, '2025-11-02 06:00:00+08'::timestamptz, '2025-11-02 00:00:00+08'::timestamptz, '2025-11-02 01:00:00+08'::timestamptz, 1.0, true),
('1025', NULL, '2025-11-03', '2025-11-03 08:00:00+08'::timestamptz, '2025-11-03 17:00:00+08'::timestamptz, '2025-11-03 12:00:00+08'::timestamptz, '2025-11-03 13:00:00+08'::timestamptz, 1.0, true),
('1025', NULL, '2025-11-04', '2025-11-04 08:00:00+08'::timestamptz, '2025-11-04 19:00:00+08'::timestamptz, '2025-11-04 12:00:00+08'::timestamptz, '2025-11-04 13:00:00+08'::timestamptz, 1.0, true),
('1025', NULL, '2025-11-05', '2025-11-05 08:00:00+08'::timestamptz, '2025-11-05 19:00:00+08'::timestamptz, '2025-11-05 12:00:00+08'::timestamptz, '2025-11-05 13:00:00+08'::timestamptz, 1.0, true),
('1025', NULL, '2025-11-06', '2025-11-06 08:00:00+08'::timestamptz, '2025-11-06 17:00:00+08'::timestamptz, '2025-11-06 12:00:00+08'::timestamptz, '2025-11-06 13:00:00+08'::timestamptz, 1.0, true),
('1025', NULL, '2025-11-07', '2025-11-07 08:00:00+08'::timestamptz, '2025-11-07 19:00:00+08'::timestamptz, '2025-11-07 12:00:00+08'::timestamptz, '2025-11-07 13:00:00+08'::timestamptz, 1.0, true),
('1025', NULL, '2025-11-08', '2025-11-08 08:00:00+08'::timestamptz, '2025-11-08 23:00:00+08'::timestamptz, '2025-11-08 12:00:00+08'::timestamptz, '2025-11-08 13:00:00+08'::timestamptz, 1.0, true),
('1025', NULL, '2025-11-10', '2025-11-10 08:00:00+08'::timestamptz, '2025-11-10 03:00:00+08'::timestamptz, '2025-11-10 12:00:00+08'::timestamptz, '2025-11-10 14:00:00+08'::timestamptz, 2.0, true),
('1025', NULL, '2025-11-11', '2025-11-11 19:00:00+08'::timestamptz, '2025-11-12 06:00:00+08'::timestamptz, '2025-11-11 23:00:00+08'::timestamptz, '2025-11-12 00:00:00+08'::timestamptz, 1.0, true),
('1025', NULL, '2025-11-12', '2025-11-12 19:00:00+08'::timestamptz, '2025-11-13 06:00:00+08'::timestamptz, '2025-11-12 23:00:00+08'::timestamptz, '2025-11-13 00:00:00+08'::timestamptz, 1.0, true),
('1025', NULL, '2025-11-13', '2025-11-13 19:00:00+08'::timestamptz, '2025-11-14 06:00:00+08'::timestamptz, '2025-11-13 23:00:00+08'::timestamptz, '2025-11-14 00:00:00+08'::timestamptz, 1.0, true),
('1025', NULL, '2025-11-14', '2025-11-14 19:00:00+08'::timestamptz, '2025-11-15 06:00:00+08'::timestamptz, '2025-11-14 23:00:00+08'::timestamptz, '2025-11-15 00:00:00+08'::timestamptz, 1.0, true),
('1025', NULL, '2025-11-15', '2025-11-15 19:00:00+08'::timestamptz, '2025-11-16 06:00:00+08'::timestamptz, '2025-11-15 23:00:00+08'::timestamptz, '2025-11-16 00:00:00+08'::timestamptz, 1.0, true),
('1025', NULL, '2025-11-17', '2025-11-17 08:00:00+08'::timestamptz, '2025-11-17 01:00:00+08'::timestamptz, '2025-11-17 12:00:00+08'::timestamptz, '2025-11-17 13:00:00+08'::timestamptz, 1.0, true),
('1025', NULL, '2025-11-18', '2025-11-18 19:00:00+08'::timestamptz, '2025-11-19 06:00:00+08'::timestamptz, '2025-11-18 23:00:00+08'::timestamptz, '2025-11-19 00:00:00+08'::timestamptz, 1.0, true),
('1025', NULL, '2025-11-19', '2025-11-19 19:00:00+08'::timestamptz, '2025-11-20 06:00:00+08'::timestamptz, '2025-11-19 23:00:00+08'::timestamptz, '2025-11-20 00:00:00+08'::timestamptz, 1.0, true),
('1025', NULL, '2025-11-20', '2025-11-20 19:00:00+08'::timestamptz, '2025-11-21 06:00:00+08'::timestamptz, '2025-11-20 23:00:00+08'::timestamptz, '2025-11-21 00:00:00+08'::timestamptz, 1.0, true),
('1025', NULL, '2025-11-21', '2025-11-21 19:00:00+08'::timestamptz, '2025-11-22 06:00:00+08'::timestamptz, '2025-11-21 23:00:00+08'::timestamptz, '2025-11-22 00:00:00+08'::timestamptz, 1.0, true),
('1025', NULL, '2025-11-22', '2025-11-22 20:00:00+08'::timestamptz, '2025-11-23 08:00:00+08'::timestamptz, '2025-11-23 00:00:00+08'::timestamptz, '2025-11-23 02:00:00+08'::timestamptz, 2.0, true),
('1025', NULL, '2025-11-23', '2025-11-23 08:00:00+08'::timestamptz, '2025-11-23 17:00:00+08'::timestamptz, '2025-11-23 12:00:00+08'::timestamptz, '2025-11-23 13:00:00+08'::timestamptz, 1.0, true),
('1025', NULL, '2025-11-24', '2025-11-24 08:00:00+08'::timestamptz, '2025-11-24 04:00:00+08'::timestamptz, '2025-11-24 12:00:00+08'::timestamptz, '2025-11-24 14:00:00+08'::timestamptz, 2.0, true),
('1025', NULL, '2025-11-25', '2025-11-25 19:00:00+08'::timestamptz, '2025-11-26 06:00:00+08'::timestamptz, '2025-11-25 23:00:00+08'::timestamptz, '2025-11-26 00:00:00+08'::timestamptz, 1.0, true),
('1025', NULL, '2025-11-26', '2025-11-26 19:00:00+08'::timestamptz, '2025-11-27 06:00:00+08'::timestamptz, '2025-11-26 23:00:00+08'::timestamptz, '2025-11-27 00:00:00+08'::timestamptz, 1.0, true),
('1025', NULL, '2025-11-27', '2025-11-27 19:00:00+08'::timestamptz, '2025-11-28 06:00:00+08'::timestamptz, '2025-11-27 23:00:00+08'::timestamptz, '2025-11-28 00:00:00+08'::timestamptz, 1.0, true),
('1025', NULL, '2025-11-28', '2025-11-28 19:00:00+08'::timestamptz, '2025-11-29 06:00:00+08'::timestamptz, '2025-11-28 23:00:00+08'::timestamptz, '2025-11-29 00:00:00+08'::timestamptz, 1.0, true),
('1025', NULL, '2025-11-29', '2025-11-29 20:00:00+08'::timestamptz, '2025-11-30 06:00:00+08'::timestamptz, '2025-11-30 00:00:00+08'::timestamptz, '2025-11-30 01:00:00+08'::timestamptz, 1.0, true);
