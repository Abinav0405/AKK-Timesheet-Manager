-- SQL script to insert shift data for worker 1015 for November 2025
-- Assuming timezone is Asia/Singapore (UTC+8)
-- Lunch breaks are calculated as starting 4 hours after entry_time and lasting for break_hours duration

INSERT INTO shifts (worker_id, site_id, work_date, entry_time, leave_time, lunch_start, lunch_end, break_hours, has_left) VALUES
('1015', NULL, '2025-11-01', '2025-11-01 08:00:00+08'::timestamptz, '2025-11-01 19:00:00+08'::timestamptz, '2025-11-01 12:00:00+08'::timestamptz, '2025-11-01 13:00:00+08'::timestamptz, 1.0, true),
('1015', NULL, '2025-11-02', '2025-11-02 08:00:00+08'::timestamptz, '2025-11-02 17:00:00+08'::timestamptz, '2025-11-02 12:00:00+08'::timestamptz, '2025-11-02 13:00:00+08'::timestamptz, 1.0, true),
('1015', NULL, '2025-11-03', '2025-11-03 08:00:00+08'::timestamptz, '2025-11-03 17:00:00+08'::timestamptz, '2025-11-03 12:00:00+08'::timestamptz, '2025-11-03 13:00:00+08'::timestamptz, 1.0, true),
('1015', NULL, '2025-11-04', '2025-11-04 08:00:00+08'::timestamptz, '2025-11-04 19:00:00+08'::timestamptz, '2025-11-04 12:00:00+08'::timestamptz, '2025-11-04 13:00:00+08'::timestamptz, 1.0, true),
('1015', NULL, '2025-11-05', '2025-11-05 08:00:00+08'::timestamptz, '2025-11-05 19:00:00+08'::timestamptz, '2025-11-05 12:00:00+08'::timestamptz, '2025-11-05 13:00:00+08'::timestamptz, 1.0, true),
('1015', NULL, '2025-11-06', '2025-11-06 08:00:00+08'::timestamptz, '2025-11-06 17:00:00+08'::timestamptz, '2025-11-06 12:00:00+08'::timestamptz, '2025-11-06 13:00:00+08'::timestamptz, 1.0, true),
('1015', NULL, '2025-11-07', '2025-11-07 08:00:00+08'::timestamptz, '2025-11-07 19:00:00+08'::timestamptz, '2025-11-07 12:00:00+08'::timestamptz, '2025-11-07 13:00:00+08'::timestamptz, 1.0, true),
('1015', NULL, '2025-11-08', '2025-11-08 08:00:00+08'::timestamptz, '2025-11-08 17:00:00+08'::timestamptz, '2025-11-08 12:00:00+08'::timestamptz, '2025-11-08 13:00:00+08'::timestamptz, 1.0, true),
('1015', NULL, '2025-11-10', '2025-11-10 08:00:00+08'::timestamptz, '2025-11-10 19:00:00+08'::timestamptz, '2025-11-10 12:00:00+08'::timestamptz, '2025-11-10 13:00:00+08'::timestamptz, 1.0, true),
('1015', NULL, '2025-11-11', '2025-11-11 08:00:00+08'::timestamptz, '2025-11-11 19:00:00+08'::timestamptz, '2025-11-11 12:00:00+08'::timestamptz, '2025-11-11 13:00:00+08'::timestamptz, 1.0, true),
('1015', NULL, '2025-11-12', '2025-11-12 08:00:00+08'::timestamptz, '2025-11-12 17:00:00+08'::timestamptz, '2025-11-12 12:00:00+08'::timestamptz, '2025-11-12 13:00:00+08'::timestamptz, 1.0, true),
('1015', NULL, '2025-11-13', '2025-11-13 08:00:00+08'::timestamptz, '2025-11-13 19:00:00+08'::timestamptz, '2025-11-13 12:00:00+08'::timestamptz, '2025-11-13 13:00:00+08'::timestamptz, 1.0, true),
('1015', NULL, '2025-11-14', '2025-11-14 08:00:00+08'::timestamptz, '2025-11-14 19:00:00+08'::timestamptz, '2025-11-14 12:00:00+08'::timestamptz, '2025-11-14 13:00:00+08'::timestamptz, 1.0, true),
('1015', NULL, '2025-11-15', '2025-11-15 08:00:00+08'::timestamptz, '2025-11-15 17:00:00+08'::timestamptz, '2025-11-15 12:00:00+08'::timestamptz, '2025-11-15 13:00:00+08'::timestamptz, 1.0, true),
('1015', NULL, '2025-11-17', '2025-11-17 08:00:00+08'::timestamptz, '2025-11-17 19:00:00+08'::timestamptz, '2025-11-17 12:00:00+08'::timestamptz, '2025-11-17 13:00:00+08'::timestamptz, 1.0, true),
('1015', NULL, '2025-11-18', '2025-11-18 08:00:00+08'::timestamptz, '2025-11-18 19:00:00+08'::timestamptz, '2025-11-18 12:00:00+08'::timestamptz, '2025-11-18 13:00:00+08'::timestamptz, 1.0, true),
('1015', NULL, '2025-11-19', '2025-11-19 08:00:00+08'::timestamptz, '2025-11-19 19:00:00+08'::timestamptz, '2025-11-19 12:00:00+08'::timestamptz, '2025-11-19 13:00:00+08'::timestamptz, 1.0, true),
('1015', NULL, '2025-11-20', '2025-11-20 08:00:00+08'::timestamptz, '2025-11-20 19:00:00+08'::timestamptz, '2025-11-20 12:00:00+08'::timestamptz, '2025-11-20 13:00:00+08'::timestamptz, 1.0, true),
('1015', NULL, '2025-11-21', '2025-11-21 08:00:00+08'::timestamptz, '2025-11-21 19:00:00+08'::timestamptz, '2025-11-21 12:00:00+08'::timestamptz, '2025-11-21 13:00:00+08'::timestamptz, 1.0, true),
('1015', NULL, '2025-11-24', '2025-11-24 08:00:00+08'::timestamptz, '2025-11-24 19:00:00+08'::timestamptz, '2025-11-24 12:00:00+08'::timestamptz, '2025-11-24 13:00:00+08'::timestamptz, 1.0, true),
('1015', NULL, '2025-11-25', '2025-11-25 08:00:00+08'::timestamptz, '2025-11-25 19:00:00+08'::timestamptz, '2025-11-25 12:00:00+08'::timestamptz, '2025-11-25 13:00:00+08'::timestamptz, 1.0, true),
('1015', NULL, '2025-11-26', '2025-11-26 08:00:00+08'::timestamptz, '2025-11-26 17:00:00+08'::timestamptz, '2025-11-26 12:00:00+08'::timestamptz, '2025-11-26 13:00:00+08'::timestamptz, 1.0, true),
('1015', NULL, '2025-11-27', '2025-11-27 08:00:00+08'::timestamptz, '2025-11-27 19:00:00+08'::timestamptz, '2025-11-27 12:00:00+08'::timestamptz, '2025-11-27 13:00:00+08'::timestamptz, 1.0, true),
('1015', NULL, '2025-11-28', '2025-11-28 08:00:00+08'::timestamptz, '2025-11-28 19:00:00+08'::timestamptz, '2025-11-28 12:00:00+08'::timestamptz, '2025-11-28 13:00:00+08'::timestamptz, 1.0, true),
('1015', NULL, '2025-11-29', '2025-11-29 08:00:00+08'::timestamptz, '2025-11-29 17:00:00+08'::timestamptz, '2025-11-29 12:00:00+08'::timestamptz, '2025-11-29 13:00:00+08'::timestamptz, 1.0, true);
