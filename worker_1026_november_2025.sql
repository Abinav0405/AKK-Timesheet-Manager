-- SQL script to insert shift data for worker 1026 for November 2025
-- Assuming timezone is Asia/Singapore (UTC+8)
-- Lunch breaks are calculated as starting 4 hours after entry_time and lasting for break_hours duration

INSERT INTO shifts (worker_id, site_id, work_date, entry_time, leave_time, lunch_start, lunch_end, break_hours, has_left) VALUES
('1026', NULL, '2025-11-01', '2025-11-01 15:00:00+08'::timestamptz, '2025-11-02 00:00:00+08'::timestamptz, '2025-11-01 19:00:00+08'::timestamptz, '2025-11-01 20:00:00+08'::timestamptz, 1.0, true),
('1026', NULL, '2025-11-02', '2025-11-02 07:00:00+08'::timestamptz, '2025-11-02 16:00:00+08'::timestamptz, '2025-11-02 11:00:00+08'::timestamptz, '2025-11-02 12:00:00+08'::timestamptz, 1.0, true),
('1026', NULL, '2025-11-03', '2025-11-03 08:00:00+08'::timestamptz, '2025-11-03 19:00:00+08'::timestamptz, '2025-11-03 12:00:00+08'::timestamptz, '2025-11-03 13:00:00+08'::timestamptz, 1.0, true),
('1026', NULL, '2025-11-04', '2025-11-04 08:00:00+08'::timestamptz, '2025-11-04 19:00:00+08'::timestamptz, '2025-11-04 12:00:00+08'::timestamptz, '2025-11-04 13:00:00+08'::timestamptz, 1.0, true),
('1026', NULL, '2025-11-05', '2025-11-05 08:00:00+08'::timestamptz, '2025-11-05 19:00:00+08'::timestamptz, '2025-11-05 12:00:00+08'::timestamptz, '2025-11-05 13:00:00+08'::timestamptz, 1.0, true),
('1026', NULL, '2025-11-06', '2025-11-06 08:00:00+08'::timestamptz, '2025-11-06 18:00:00+08'::timestamptz, '2025-11-06 12:00:00+08'::timestamptz, '2025-11-06 13:00:00+08'::timestamptz, 1.0, true),
('1026', NULL, '2025-11-07', '2025-11-07 07:00:00+08'::timestamptz, '2025-11-07 16:00:00+08'::timestamptz, '2025-11-07 11:00:00+08'::timestamptz, '2025-11-07 12:00:00+08'::timestamptz, 1.0, true),
('1026', NULL, '2025-11-08', '2025-11-08 07:00:00+08'::timestamptz, '2025-11-08 18:00:00+08'::timestamptz, '2025-11-08 11:00:00+08'::timestamptz, '2025-11-08 12:00:00+08'::timestamptz, 1.0, true),
('1026', NULL, '2025-11-09', '2025-11-09 07:00:00+08'::timestamptz, '2025-11-09 16:00:00+08'::timestamptz, '2025-11-09 11:00:00+08'::timestamptz, '2025-11-09 12:00:00+08'::timestamptz, 1.0, true),
('1026', NULL, '2025-11-10', '2025-11-10 15:00:00+08'::timestamptz, '2025-11-11 00:00:00+08'::timestamptz, '2025-11-10 19:00:00+08'::timestamptz, '2025-11-10 20:00:00+08'::timestamptz, 1.0, true),
('1026', NULL, '2025-11-11', '2025-11-11 15:00:00+08'::timestamptz, '2025-11-12 00:00:00+08'::timestamptz, '2025-11-11 19:00:00+08'::timestamptz, '2025-11-11 20:00:00+08'::timestamptz, 1.0, true),
('1026', NULL, '2025-11-12', '2025-11-12 15:00:00+08'::timestamptz, '2025-11-13 00:00:00+08'::timestamptz, '2025-11-12 19:00:00+08'::timestamptz, '2025-11-12 20:00:00+08'::timestamptz, 1.0, true),
('1026', NULL, '2025-11-13', '2025-11-13 15:00:00+08'::timestamptz, '2025-11-14 00:00:00+08'::timestamptz, '2025-11-13 19:00:00+08'::timestamptz, '2025-11-13 20:00:00+08'::timestamptz, 1.0, true),
('1026', NULL, '2025-11-14', '2025-11-14 15:00:00+08'::timestamptz, '2025-11-15 00:00:00+08'::timestamptz, '2025-11-14 19:00:00+08'::timestamptz, '2025-11-14 20:00:00+08'::timestamptz, 1.0, true),
('1026', NULL, '2025-11-15', '2025-11-15 15:00:00+08'::timestamptz, '2025-11-16 00:00:00+08'::timestamptz, '2025-11-15 19:00:00+08'::timestamptz, '2025-11-15 20:00:00+08'::timestamptz, 1.0, true),
('1026', NULL, '2025-11-16', '2025-11-16 15:00:00+08'::timestamptz, '2025-11-17 00:00:00+08'::timestamptz, '2025-11-16 19:00:00+08'::timestamptz, '2025-11-16 20:00:00+08'::timestamptz, 1.0, true),
('1026', NULL, '2025-11-17', '2025-11-17 23:00:00+08'::timestamptz, '2025-11-18 08:00:00+08'::timestamptz, '2025-11-18 03:00:00+08'::timestamptz, '2025-11-18 04:00:00+08'::timestamptz, 1.0, true),
('1026', NULL, '2025-11-18', '2025-11-18 23:00:00+08'::timestamptz, '2025-11-19 08:00:00+08'::timestamptz, '2025-11-19 03:00:00+08'::timestamptz, '2025-11-19 04:00:00+08'::timestamptz, 1.0, true),
('1026', NULL, '2025-11-19', '2025-11-19 23:00:00+08'::timestamptz, '2025-11-20 08:00:00+08'::timestamptz, '2025-11-20 03:00:00+08'::timestamptz, '2025-11-20 04:00:00+08'::timestamptz, 1.0, true),
('1026', NULL, '2025-11-20', '2025-11-20 23:00:00+08'::timestamptz, '2025-11-21 08:00:00+08'::timestamptz, '2025-11-21 03:00:00+08'::timestamptz, '2025-11-21 04:00:00+08'::timestamptz, 1.0, true),
('1026', NULL, '2025-11-21', '2025-11-21 16:00:00+08'::timestamptz, '2025-11-22 08:00:00+08'::timestamptz, '2025-11-21 20:00:00+08'::timestamptz, '2025-11-21 21:00:00+08'::timestamptz, 1.0, true),
('1026', NULL, '2025-11-24', '2025-11-24 23:00:00+08'::timestamptz, '2025-11-25 08:00:00+08'::timestamptz, '2025-11-25 03:00:00+08'::timestamptz, '2025-11-25 04:00:00+08'::timestamptz, 1.0, true),
('1026', NULL, '2025-11-25', '2025-11-25 23:00:00+08'::timestamptz, '2025-11-26 08:00:00+08'::timestamptz, '2025-11-26 03:00:00+08'::timestamptz, '2025-11-26 04:00:00+08'::timestamptz, 1.0, true),
('1026', NULL, '2025-11-26', '2025-11-26 23:00:00+08'::timestamptz, '2025-11-27 08:00:00+08'::timestamptz, '2025-11-27 03:00:00+08'::timestamptz, '2025-11-27 04:00:00+08'::timestamptz, 1.0, true),
('1026', NULL, '2025-11-27', '2025-11-27 23:00:00+08'::timestamptz, '2025-11-28 08:00:00+08'::timestamptz, '2025-11-28 03:00:00+08'::timestamptz, '2025-11-28 04:00:00+08'::timestamptz, 1.0, true),
('1026', NULL, '2025-11-28', '2025-11-28 23:00:00+08'::timestamptz, '2025-11-29 08:00:00+08'::timestamptz, '2025-11-29 03:00:00+08'::timestamptz, '2025-11-29 04:00:00+08'::timestamptz, 1.0, true),
('1026', NULL, '2025-11-29', '2025-11-29 08:00:00+08'::timestamptz, '2025-11-29 18:00:00+08'::timestamptz, '2025-11-29 12:00:00+08'::timestamptz, '2025-11-29 13:00:00+08'::timestamptz, 1.0, true),
('1026', NULL, '2025-11-30', '2025-11-30 08:00:00+08'::timestamptz, '2025-11-30 17:00:00+08'::timestamptz, '2025-11-30 12:00:00+08'::timestamptz, '2025-11-30 13:00:00+08'::timestamptz, 1.0, true);
