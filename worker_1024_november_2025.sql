-- SQL script to insert shift data for worker 1024 for November 2025
-- Assuming timezone is Asia/Singapore (UTC+8)
-- Lunch breaks are calculated as starting 4 hours after entry_time and lasting for break_hours duration

INSERT INTO shifts (worker_id, site_id, work_date, entry_time, leave_time, lunch_start, lunch_end, break_hours, has_left) VALUES
('1024', NULL, '2025-11-01', '2025-11-01 15:00:00+08'::timestamptz, '2025-11-02 00:00:00+08'::timestamptz, '2025-11-01 19:00:00+08'::timestamptz, '2025-11-01 20:00:00+08'::timestamptz, 1.0, true),
('1024', NULL, '2025-11-02', '2025-11-02 15:00:00+08'::timestamptz, '2025-11-03 00:00:00+08'::timestamptz, '2025-11-02 19:00:00+08'::timestamptz, '2025-11-02 20:00:00+08'::timestamptz, 1.0, true),
('1024', NULL, '2025-11-03', '2025-11-03 15:00:00+08'::timestamptz, '2025-11-04 00:00:00+08'::timestamptz, '2025-11-03 19:00:00+08'::timestamptz, '2025-11-03 20:00:00+08'::timestamptz, 1.0, true),
('1024', NULL, '2025-11-04', '2025-11-04 15:00:00+08'::timestamptz, '2025-11-05 00:00:00+08'::timestamptz, '2025-11-04 19:00:00+08'::timestamptz, '2025-11-04 20:00:00+08'::timestamptz, 1.0, true),
('1024', NULL, '2025-11-05', '2025-11-05 15:00:00+08'::timestamptz, '2025-11-06 00:00:00+08'::timestamptz, '2025-11-05 19:00:00+08'::timestamptz, '2025-11-05 20:00:00+08'::timestamptz, 1.0, true),
('1024', NULL, '2025-11-06', '2025-11-06 15:00:00+08'::timestamptz, '2025-11-07 00:00:00+08'::timestamptz, '2025-11-06 19:00:00+08'::timestamptz, '2025-11-06 20:00:00+08'::timestamptz, 1.0, true),
('1024', NULL, '2025-11-07', '2025-11-07 15:00:00+08'::timestamptz, '2025-11-08 00:00:00+08'::timestamptz, '2025-11-07 19:00:00+08'::timestamptz, '2025-11-07 20:00:00+08'::timestamptz, 1.0, true),
('1024', NULL, '2025-11-08', '2025-11-08 15:00:00+08'::timestamptz, '2025-11-09 00:00:00+08'::timestamptz, '2025-11-08 19:00:00+08'::timestamptz, '2025-11-08 20:00:00+08'::timestamptz, 1.0, true),
('1024', NULL, '2025-11-09', '2025-11-09 15:00:00+08'::timestamptz, '2025-11-10 00:00:00+08'::timestamptz, '2025-11-09 19:00:00+08'::timestamptz, '2025-11-09 20:00:00+08'::timestamptz, 1.0, true),
('1024', NULL, '2025-11-10', '2025-11-10 07:00:00+08'::timestamptz, '2025-11-10 18:00:00+08'::timestamptz, '2025-11-10 11:00:00+08'::timestamptz, '2025-11-10 12:00:00+08'::timestamptz, 1.0, true),
('1024', NULL, '2025-11-11', '2025-11-11 07:00:00+08'::timestamptz, '2025-11-11 18:00:00+08'::timestamptz, '2025-11-11 11:00:00+08'::timestamptz, '2025-11-11 12:00:00+08'::timestamptz, 1.0, true),
('1024', NULL, '2025-11-12', '2025-11-12 07:00:00+08'::timestamptz, '2025-11-12 16:00:00+08'::timestamptz, '2025-11-12 11:00:00+08'::timestamptz, '2025-11-12 12:00:00+08'::timestamptz, 1.0, true),
('1024', NULL, '2025-11-13', '2025-11-13 07:00:00+08'::timestamptz, '2025-11-13 19:00:00+08'::timestamptz, '2025-11-13 11:00:00+08'::timestamptz, '2025-11-13 12:00:00+08'::timestamptz, 1.0, true),
('1024', NULL, '2025-11-14', '2025-11-14 07:00:00+08'::timestamptz, '2025-11-14 16:00:00+08'::timestamptz, '2025-11-14 11:00:00+08'::timestamptz, '2025-11-14 12:00:00+08'::timestamptz, 1.0, true),
('1024', NULL, '2025-11-15', '2025-11-15 07:00:00+08'::timestamptz, '2025-11-15 17:00:00+08'::timestamptz, '2025-11-15 11:00:00+08'::timestamptz, '2025-11-15 12:00:00+08'::timestamptz, 1.0, true),
('1024', NULL, '2025-11-16', '2025-11-16 08:00:00+08'::timestamptz, '2025-11-16 17:00:00+08'::timestamptz, '2025-11-16 12:00:00+08'::timestamptz, '2025-11-16 13:00:00+08'::timestamptz, 1.0, true),
('1024', NULL, '2025-11-17', '2025-11-17 23:00:00+08'::timestamptz, '2025-11-18 08:00:00+08'::timestamptz, '2025-11-18 03:00:00+08'::timestamptz, '2025-11-18 04:00:00+08'::timestamptz, 1.0, true),
('1024', NULL, '2025-11-18', '2025-11-18 23:00:00+08'::timestamptz, '2025-11-19 08:00:00+08'::timestamptz, '2025-11-19 03:00:00+08'::timestamptz, '2025-11-19 04:00:00+08'::timestamptz, 1.0, true),
('1024', NULL, '2025-11-19', '2025-11-19 19:00:00+08'::timestamptz, '2025-11-20 06:00:00+08'::timestamptz, '2025-11-19 23:00:00+08'::timestamptz, '2025-11-20 00:00:00+08'::timestamptz, 1.0, true),
('1024', NULL, '2025-11-20', '2025-11-20 19:00:00+08'::timestamptz, '2025-11-21 06:00:00+08'::timestamptz, '2025-11-20 23:00:00+08'::timestamptz, '2025-11-21 00:00:00+08'::timestamptz, 1.0, true),
('1024', NULL, '2025-11-21', '2025-11-21 19:00:00+08'::timestamptz, '2025-11-22 06:00:00+08'::timestamptz, '2025-11-21 23:00:00+08'::timestamptz, '2025-11-22 00:00:00+08'::timestamptz, 1.0, true),
('1024', NULL, '2025-11-24', '2025-11-24 08:00:00+08'::timestamptz, '2025-11-24 04:00:00+08'::timestamptz, '2025-11-24 12:00:00+08'::timestamptz, '2025-11-24 14:00:00+08'::timestamptz, 2.0, true),
('1024', NULL, '2025-11-25', '2025-11-25 19:00:00+08'::timestamptz, '2025-11-26 06:00:00+08'::timestamptz, '2025-11-25 23:00:00+08'::timestamptz, '2025-11-26 00:00:00+08'::timestamptz, 1.0, true),
('1024', NULL, '2025-11-26', '2025-11-26 23:00:00+08'::timestamptz, '2025-11-27 08:00:00+08'::timestamptz, '2025-11-27 03:00:00+08'::timestamptz, '2025-11-27 04:00:00+08'::timestamptz, 1.0, true),
('1024', NULL, '2025-11-27', '2025-11-27 23:00:00+08'::timestamptz, '2025-11-28 08:00:00+08'::timestamptz, '2025-11-28 03:00:00+08'::timestamptz, '2025-11-28 04:00:00+08'::timestamptz, 1.0, true),
('1024', NULL, '2025-11-28', '2025-11-28 23:00:00+08'::timestamptz, '2025-11-29 08:00:00+08'::timestamptz, '2025-11-29 03:00:00+08'::timestamptz, '2025-11-29 04:00:00+08'::timestamptz, 1.0, true),
('1024', NULL, '2025-11-29', '2025-11-29 08:00:00+08'::timestamptz, '2025-11-29 18:00:00+08'::timestamptz, '2025-11-29 12:00:00+08'::timestamptz, '2025-11-29 13:00:00+08'::timestamptz, 1.0, true),
('1024', NULL, '2025-11-30', '2025-11-30 08:00:00+08'::timestamptz, '2025-11-30 20:00:00+08'::timestamptz, '2025-11-30 12:00:00+08'::timestamptz, '2025-11-30 13:00:00+08'::timestamptz, 1.0, true);
