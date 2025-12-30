-- SQL to insert/update shifts for worker 1006 for November 2025
-- Entry/Exit times preserved exactly, break timings calculated based on break hours

-- Shift 1: Sat 1/11/25 - 23:00 to 8:00 next day, 1 hour break
INSERT INTO shifts (
    worker_id, site_id, work_date, entry_time, leave_time, 
    breaks, leave_type, worked_hours, sunday_hours, ot_hours
) VALUES (
    '1006', 
    'SITE_DEFAULT', 
    '2025-11-01', 
    '23:00:00', 
    '2025-11-02T08:00:00',
    '[{"break_start": "02:00", "break_end": "03:00"}]',
    NULL,
    8.0,
    0.0,
    0.0
) ON CONFLICT (worker_id, work_date) DO UPDATE SET
    entry_time = EXCLUDED.entry_time,
    leave_time = EXCLUDED.leave_time,
    breaks = EXCLUDED.breaks,
    worked_hours = EXCLUDED.worked_hours,
    sunday_hours = EXCLUDED.sunday_hours,
    ot_hours = EXCLUDED.ot_hours;

-- Shift 2: Sun 2/11/25 - 23:00 to 8:00 next day, 1 hour break (Sunday rates apply)
INSERT INTO shifts (
    worker_id, site_id, work_date, entry_time, leave_time, 
    breaks, leave_type, worked_hours, sunday_hours, ot_hours
) VALUES (
    '1006', 
    'SITE_DEFAULT', 
    '2025-11-02', 
    '23:00:00', 
    '2025-11-03T08:00:00',
    '[{"break_start": "02:00", "break_end": "03:00"}]',
    NULL,
    0.0,
    8.0,
    0.0
) ON CONFLICT (worker_id, work_date) DO UPDATE SET
    entry_time = EXCLUDED.entry_time,
    leave_time = EXCLUDED.leave_time,
    breaks = EXCLUDED.breaks,
    worked_hours = EXCLUDED.worked_hours,
    sunday_hours = EXCLUDED.sunday_hours,
    ot_hours = EXCLUDED.ot_hours;

-- Shift 3: Mon 3/11/25 - 23:00 to 8:00 next day, 1 hour break
INSERT INTO shifts (
    worker_id, site_id, work_date, entry_time, leave_time, 
    breaks, leave_type, worked_hours, sunday_hours, ot_hours
) VALUES (
    '1006', 
    'SITE_DEFAULT', 
    '2025-11-03', 
    '23:00:00', 
    '2025-11-04T08:00:00',
    '[{"break_start": "02:00", "break_end": "03:00"}]',
    NULL,
    8.0,
    0.0,
    0.0
) ON CONFLICT (worker_id, work_date) DO UPDATE SET
    entry_time = EXCLUDED.entry_time,
    leave_time = EXCLUDED.leave_time,
    breaks = EXCLUDED.breaks,
    worked_hours = EXCLUDED.worked_hours,
    sunday_hours = EXCLUDED.sunday_hours,
    ot_hours = EXCLUDED.ot_hours;

-- Shift 4: Tue 4/11/25 - 23:00 to 8:00 next day, 1 hour break
INSERT INTO shifts (
    worker_id, site_id, work_date, entry_time, leave_time, 
    breaks, leave_type, worked_hours, sunday_hours, ot_hours
) VALUES (
    '1006', 
    'SITE_DEFAULT', 
    '2025-11-04', 
    '23:00:00', 
    '2025-11-05T08:00:00',
    '[{"break_start": "02:00", "break_end": "03:00"}]',
    NULL,
    8.0,
    0.0,
    0.0
) ON CONFLICT (worker_id, work_date) DO UPDATE SET
    entry_time = EXCLUDED.entry_time,
    leave_time = EXCLUDED.leave_time,
    breaks = EXCLUDED.breaks,
    worked_hours = EXCLUDED.worked_hours,
    sunday_hours = EXCLUDED.sunday_hours,
    ot_hours = EXCLUDED.ot_hours;

-- Shift 5: Wed 5/11/25 - 23:00 to 8:00 next day, 1 hour break
INSERT INTO shifts (
    worker_id, site_id, work_date, entry_time, leave_time, 
    breaks, leave_type, worked_hours, sunday_hours, ot_hours
) VALUES (
    '1006', 
    'SITE_DEFAULT', 
    '2025-11-05', 
    '23:00:00', 
    '2025-11-06T08:00:00',
    '[{"break_start": "02:00", "break_end": "03:00"}]',
    NULL,
    8.0,
    0.0,
    0.0
) ON CONFLICT (worker_id, work_date) DO UPDATE SET
    entry_time = EXCLUDED.entry_time,
    leave_time = EXCLUDED.leave_time,
    breaks = EXCLUDED.breaks,
    worked_hours = EXCLUDED.worked_hours,
    sunday_hours = EXCLUDED.sunday_hours,
    ot_hours = EXCLUDED.ot_hours;

-- Shift 6: Thu 6/11/25 - 23:00 to 8:00 next day, 1 hour break
INSERT INTO shifts (
    worker_id, site_id, work_date, entry_time, leave_time, 
    breaks, leave_type, worked_hours, sunday_hours, ot_hours
) VALUES (
    '1006', 
    'SITE_DEFAULT', 
    '2025-11-06', 
    '23:00:00', 
    '2025-11-07T08:00:00',
    '[{"break_start": "02:00", "break_end": "03:00"}]',
    NULL,
    8.0,
    0.0,
    0.0
) ON CONFLICT (worker_id, work_date) DO UPDATE SET
    entry_time = EXCLUDED.entry_time,
    leave_time = EXCLUDED.leave_time,
    breaks = EXCLUDED.breaks,
    worked_hours = EXCLUDED.worked_hours,
    sunday_hours = EXCLUDED.sunday_hours,
    ot_hours = EXCLUDED.ot_hours;

-- Shift 7: Fri 7/11/25 - 23:00 to 8:00 next day, 1 hour break
INSERT INTO shifts (
    worker_id, site_id, work_date, entry_time, leave_time, 
    breaks, leave_type, worked_hours, sunday_hours, ot_hours
) VALUES (
    '1006', 
    'SITE_DEFAULT', 
    '2025-11-07', 
    '23:00:00', 
    '2025-11-08T08:00:00',
    '[{"break_start": "02:00", "break_end": "03:00"}]',
    NULL,
    8.0,
    0.0,
    0.0
) ON CONFLICT (worker_id, work_date) DO UPDATE SET
    entry_time = EXCLUDED.entry_time,
    leave_time = EXCLUDED.leave_time,
    breaks = EXCLUDED.breaks,
    worked_hours = EXCLUDED.worked_hours,
    sunday_hours = EXCLUDED.sunday_hours,
    ot_hours = EXCLUDED.ot_hours;

-- Shift 8: Sat 8/11/25 - 23:00 to 8:00 next day, 1 hour break
INSERT INTO shifts (
    worker_id, site_id, work_date, entry_time, leave_time, 
    breaks, leave_type, worked_hours, sunday_hours, ot_hours
) VALUES (
    '1006', 
    'SITE_DEFAULT', 
    '2025-11-08', 
    '23:00:00', 
    '2025-11-09T08:00:00',
    '[{"break_start": "02:00", "break_end": "03:00"}]',
    NULL,
    8.0,
    0.0,
    0.0
) ON CONFLICT (worker_id, work_date) DO UPDATE SET
    entry_time = EXCLUDED.entry_time,
    leave_time = EXCLUDED.leave_time,
    breaks = EXCLUDED.breaks,
    worked_hours = EXCLUDED.worked_hours,
    sunday_hours = EXCLUDED.sunday_hours,
    ot_hours = EXCLUDED.ot_hours;

-- Shift 9: Sun 9/11/25 - 23:00 to 8:00 next day, 1 hour break (Sunday rates apply)
INSERT INTO shifts (
    worker_id, site_id, work_date, entry_time, leave_time, 
    breaks, leave_type, worked_hours, sunday_hours, ot_hours
) VALUES (
    '1006', 
    'SITE_DEFAULT', 
    '2025-11-09', 
    '23:00:00', 
    '2025-11-10T08:00:00',
    '[{"break_start": "02:00", "break_end": "03:00"}]',
    NULL,
    0.0,
    8.0,
    0.0
) ON CONFLICT (worker_id, work_date) DO UPDATE SET
    entry_time = EXCLUDED.entry_time,
    leave_time = EXCLUDED.leave_time,
    breaks = EXCLUDED.breaks,
    worked_hours = EXCLUDED.worked_hours,
    sunday_hours = EXCLUDED.sunday_hours,
    ot_hours = EXCLUDED.ot_hours;

-- Shift 10: Mon 10/11/25 - 23:00 to 8:00 next day, 1 hour break
INSERT INTO shifts (
    worker_id, site_id, work_date, entry_time, leave_time, 
    breaks, leave_type, worked_hours, sunday_hours, ot_hours
) VALUES (
    '1006', 
    'SITE_DEFAULT', 
    '2025-11-10', 
    '23:00:00', 
    '2025-11-11T08:00:00',
    '[{"break_start": "02:00", "break_end": "03:00"}]',
    NULL,
    8.0,
    0.0,
    0.0
) ON CONFLICT (worker_id, work_date) DO UPDATE SET
    entry_time = EXCLUDED.entry_time,
    leave_time = EXCLUDED.leave_time,
    breaks = EXCLUDED.breaks,
    worked_hours = EXCLUDED.worked_hours,
    sunday_hours = EXCLUDED.sunday_hours,
    ot_hours = EXCLUDED.ot_hours;

-- Shift 11: Tue 11/11/25 - 23:00 to 8:00 next day, 1 hour break
INSERT INTO shifts (
    worker_id, site_id, work_date, entry_time, leave_time, 
    breaks, leave_type, worked_hours, sunday_hours, ot_hours
) VALUES (
    '1006', 
    'SITE_DEFAULT', 
    '2025-11-11', 
    '23:00:00', 
    '2025-11-12T08:00:00',
    '[{"break_start": "02:00", "break_end": "03:00"}]',
    NULL,
    8.0,
    0.0,
    0.0
) ON CONFLICT (worker_id, work_date) DO UPDATE SET
    entry_time = EXCLUDED.entry_time,
    leave_time = EXCLUDED.leave_time,
    breaks = EXCLUDED.breaks,
    worked_hours = EXCLUDED.worked_hours,
    sunday_hours = EXCLUDED.sunday_hours,
    ot_hours = EXCLUDED.ot_hours;

-- Shift 12: Wed 12/11/25 - 23:00 to 8:00 next day, 1 hour break
INSERT INTO shifts (
    worker_id, site_id, work_date, entry_time, leave_time, 
    breaks, leave_type, worked_hours, sunday_hours, ot_hours
) VALUES (
    '1006', 
    'SITE_DEFAULT', 
    '2025-11-12', 
    '23:00:00', 
    '2025-11-13T08:00:00',
    '[{"break_start": "02:00", "break_end": "03:00"}]',
    NULL,
    8.0,
    0.0,
    0.0
) ON CONFLICT (worker_id, work_date) DO UPDATE SET
    entry_time = EXCLUDED.entry_time,
    leave_time = EXCLUDED.leave_time,
    breaks = EXCLUDED.breaks,
    worked_hours = EXCLUDED.worked_hours,
    sunday_hours = EXCLUDED.sunday_hours,
    ot_hours = EXCLUDED.ot_hours;

-- Shift 13: Thu 13/11/25 - 23:00 to 8:00 next day, 1 hour break
INSERT INTO shifts (
    worker_id, site_id, work_date, entry_time, leave_time, 
    breaks, leave_type, worked_hours, sunday_hours, ot_hours
) VALUES (
    '1006', 
    'SITE_DEFAULT', 
    '2025-11-13', 
    '23:00:00', 
    '2025-11-14T08:00:00',
    '[{"break_start": "02:00", "break_end": "03:00"}]',
    NULL,
    8.0,
    0.0,
    0.0
) ON CONFLICT (worker_id, work_date) DO UPDATE SET
    entry_time = EXCLUDED.entry_time,
    leave_time = EXCLUDED.leave_time,
    breaks = EXCLUDED.breaks,
    worked_hours = EXCLUDED.worked_hours,
    sunday_hours = EXCLUDED.sunday_hours,
    ot_hours = EXCLUDED.ot_hours;

-- Shift 14: Fri 14/11/25 - 23:00 to 8:00 next day, 1 hour break
INSERT INTO shifts (
    worker_id, site_id, work_date, entry_time, leave_time, 
    breaks, leave_type, worked_hours, sunday_hours, ot_hours
) VALUES (
    '1006', 
    'SITE_DEFAULT', 
    '2025-11-14', 
    '23:00:00', 
    '2025-11-15T08:00:00',
    '[{"break_start": "02:00", "break_end": "03:00"}]',
    NULL,
    8.0,
    0.0,
    0.0
) ON CONFLICT (worker_id, work_date) DO UPDATE SET
    entry_time = EXCLUDED.entry_time,
    leave_time = EXCLUDED.leave_time,
    breaks = EXCLUDED.breaks,
    worked_hours = EXCLUDED.worked_hours,
    sunday_hours = EXCLUDED.sunday_hours,
    ot_hours = EXCLUDED.ot_hours;

-- Shift 15: Sat 15/11/25 - 23:00 to 8:00 next day, 1 hour break
INSERT INTO shifts (
    worker_id, site_id, work_date, entry_time, leave_time, 
    breaks, leave_type, worked_hours, sunday_hours, ot_hours
) VALUES (
    '1006', 
    'SITE_DEFAULT', 
    '2025-11-15', 
    '23:00:00', 
    '2025-11-16T08:00:00',
    '[{"break_start": "02:00", "break_end": "03:00"}]',
    NULL,
    8.0,
    0.0,
    0.0
) ON CONFLICT (worker_id, work_date) DO UPDATE SET
    entry_time = EXCLUDED.entry_time,
    leave_time = EXCLUDED.leave_time,
    breaks = EXCLUDED.breaks,
    worked_hours = EXCLUDED.worked_hours,
    sunday_hours = EXCLUDED.sunday_hours,
    ot_hours = EXCLUDED.ot_hours;

-- Shift 16: Sun 16/11/25 - 23:00 to 8:00 next day, 1 hour break (Sunday rates apply)
INSERT INTO shifts (
    worker_id, site_id, work_date, entry_time, leave_time, 
    breaks, leave_type, worked_hours, sunday_hours, ot_hours
) VALUES (
    '1006', 
    'SITE_DEFAULT', 
    '2025-11-16', 
    '23:00:00', 
    '2025-11-17T08:00:00',
    '[{"break_start": "02:00", "break_end": "03:00"}]',
    NULL,
    0.0,
    8.0,
    0.0
) ON CONFLICT (worker_id, work_date) DO UPDATE SET
    entry_time = EXCLUDED.entry_time,
    leave_time = EXCLUDED.leave_time,
    breaks = EXCLUDED.breaks,
    worked_hours = EXCLUDED.worked_hours,
    sunday_hours = EXCLUDED.sunday_hours,
    ot_hours = EXCLUDED.ot_hours;

-- Shift 17: Mon 17/11/25 - 15:00 to 0:00 next day, 1 hour break (9 hours total - 1 break = 8 hours)
INSERT INTO shifts (
    worker_id, site_id, work_date, entry_time, leave_time, 
    breaks, leave_type, worked_hours, sunday_hours, ot_hours
) VALUES (
    '1006', 
    'SITE_DEFAULT', 
    '2025-11-17', 
    '15:00:00', 
    '2025-11-18T00:00:00',
    '[{"break_start": "19:00", "break_end": "20:00"}]',
    NULL,
    8.0,
    0.0,
    0.0
) ON CONFLICT (worker_id, work_date) DO UPDATE SET
    entry_time = EXCLUDED.entry_time,
    leave_time = EXCLUDED.leave_time,
    breaks = EXCLUDED.breaks,
    worked_hours = EXCLUDED.worked_hours,
    sunday_hours = EXCLUDED.sunday_hours,
    ot_hours = EXCLUDED.ot_hours;

-- Shift 18: Tue 18/11/25 - 15:00 to 0:00 next day, 1 hour break (9 hours total - 1 break = 8 hours)
INSERT INTO shifts (
    worker_id, site_id, work_date, entry_time, leave_time, 
    breaks, leave_type, worked_hours, sunday_hours, ot_hours
) VALUES (
    '1006', 
    'SITE_DEFAULT', 
    '2025-11-18', 
    '15:00:00', 
    '2025-11-19T00:00:00',
    '[{"break_start": "19:00", "break_end": "20:00"}]',
    NULL,
    8.0,
    0.0,
    0.0
) ON CONFLICT (worker_id, work_date) DO UPDATE SET
    entry_time = EXCLUDED.entry_time,
    leave_time = EXCLUDED.leave_time,
    breaks = EXCLUDED.breaks,
    worked_hours = EXCLUDED.worked_hours,
    sunday_hours = EXCLUDED.sunday_hours,
    ot_hours = EXCLUDED.ot_hours;

-- Shift 19: Wed 19/11/25 - 15:00 to 0:00 next day, 1 hour break (9 hours total - 1 break = 8 hours)
INSERT INTO shifts (
    worker_id, site_id, work_date, entry_time, leave_time, 
    breaks, leave_type, worked_hours, sunday_hours, ot_hours
) VALUES (
    '1006', 
    'SITE_DEFAULT', 
    '2025-11-19', 
    '15:00:00', 
    '2025-11-20T00:00:00',
    '[{"break_start": "19:00", "break_end": "20:00"}]',
    NULL,
    8.0,
    0.0,
    0.0
) ON CONFLICT (worker_id, work_date) DO UPDATE SET
    entry_time = EXCLUDED.entry_time,
    leave_time = EXCLUDED.leave_time,
    breaks = EXCLUDED.breaks,
    worked_hours = EXCLUDED.worked_hours,
    sunday_hours = EXCLUDED.sunday_hours,
    ot_hours = EXCLUDED.ot_hours;

-- Shift 20: Thu 20/11/25 - 15:00 to 0:00 next day, 1 hour break (9 hours total - 1 break = 8 hours)
INSERT INTO shifts (
    worker_id, site_id, work_date, entry_time, leave_time, 
    breaks, leave_type, worked_hours, sunday_hours, ot_hours
) VALUES (
    '1006', 
    'SITE_DEFAULT', 
    '2025-11-20', 
    '15:00:00', 
    '2025-11-21T00:00:00',
    '[{"break_start": "19:00", "break_end": "20:00"}]',
    NULL,
    8.0,
    0.0,
    0.0
) ON CONFLICT (worker_id, work_date) DO UPDATE SET
    entry_time = EXCLUDED.entry_time,
    leave_time = EXCLUDED.leave_time,
    breaks = EXCLUDED.breaks,
    worked_hours = EXCLUDED.worked_hours,
    sunday_hours = EXCLUDED.sunday_hours,
    ot_hours = EXCLUDED.ot_hours;

-- Shift 21: Fri 21/11/25 - 15:00 to 8:00 next day, 2 hour break (17 hours total - 2 break = 15 hours)
INSERT INTO shifts (
    worker_id, site_id, work_date, entry_time, leave_time, 
    breaks, leave_type, worked_hours, sunday_hours, ot_hours
) VALUES (
    '1006', 
    'SITE_DEFAULT', 
    '2025-11-21', 
    '15:00:00', 
    '2025-11-22T08:00:00',
    '[{"break_start": "19:00", "break_end": "20:00"}, {"break_start": "23:00", "break_end": "00:00"}]',
    NULL,
    8.0,
    0.0,
    7.0
) ON CONFLICT (worker_id, work_date) DO UPDATE SET
    entry_time = EXCLUDED.entry_time,
    leave_time = EXCLUDED.leave_time,
    breaks = EXCLUDED.breaks,
    worked_hours = EXCLUDED.worked_hours,
    sunday_hours = EXCLUDED.sunday_hours,
    ot_hours = EXCLUDED.ot_hours;

-- Shift 22: Sat 22/11/25 - 15:00 to 0:00 next day, 1 hour break (9 hours total - 1 break = 8 hours)
INSERT INTO shifts (
    worker_id, site_id, work_date, entry_time, leave_time, 
    breaks, leave_type, worked_hours, sunday_hours, ot_hours
) VALUES (
    '1006', 
    'SITE_DEFAULT', 
    '2025-11-22', 
    '15:00:00', 
    '2025-11-23T00:00:00',
    '[{"break_start": "19:00", "break_end": "20:00"}]',
    NULL,
    8.0,
    0.0,
    0.0
) ON CONFLICT (worker_id, work_date) DO UPDATE SET
    entry_time = EXCLUDED.entry_time,
    leave_time = EXCLUDED.leave_time,
    breaks = EXCLUDED.breaks,
    worked_hours = EXCLUDED.worked_hours,
    sunday_hours = EXCLUDED.sunday_hours,
    ot_hours = EXCLUDED.ot_hours;

-- Shift 23: Sun 23/11/25 - 15:00 to 8:00 next day, 2 hour break (17 hours total - 2 break = 15 hours, Sunday rates for 8 hours)
INSERT INTO shifts (
    worker_id, site_id, work_date, entry_time, leave_time, 
    breaks, leave_type, worked_hours, sunday_hours, ot_hours
) VALUES (
    '1006', 
    'SITE_DEFAULT', 
    '2025-11-23', 
    '15:00:00', 
    '2025-11-24T08:00:00',
    '[{"break_start": "19:00", "break_end": "20:00"}, {"break_start": "23:00", "break_end": "00:00"}]',
    NULL,
    0.0,
    8.0,
    7.0
) ON CONFLICT (worker_id, work_date) DO UPDATE SET
    entry_time = EXCLUDED.entry_time,
    leave_time = EXCLUDED.leave_time,
    breaks = EXCLUDED.breaks,
    worked_hours = EXCLUDED.worked_hours,
    sunday_hours = EXCLUDED.sunday_hours,
    ot_hours = EXCLUDED.ot_hours;

-- Shift 24: Mon 24/11/25 - 15:00 to 0:00 next day, 2 hour break (10 hours total - 2 break = 8 hours)
INSERT INTO shifts (
    worker_id, site_id, work_date, entry_time, leave_time, 
    breaks, leave_type, worked_hours, sunday_hours, ot_hours
) VALUES (
    '1006', 
    'SITE_DEFAULT', 
    '2025-11-24', 
    '15:00:00', 
    '2025-11-25T00:00:00',
    '[{"break_start": "18:00", "break_end": "19:00"}, {"break_start": "21:00", "break_end": "22:00"}]',
    NULL,
    8.0,
    0.0,
    0.0
) ON CONFLICT (worker_id, work_date) DO UPDATE SET
    entry_time = EXCLUDED.entry_time,
    leave_time = EXCLUDED.leave_time,
    breaks = EXCLUDED.breaks,
    worked_hours = EXCLUDED.worked_hours,
    sunday_hours = EXCLUDED.sunday_hours,
    ot_hours = EXCLUDED.ot_hours;

-- Shift 25: Tue 25/11/25 - 15:00 to 0:00 next day, 1 hour break (9 hours total - 1 break = 8 hours)
INSERT INTO shifts (
    worker_id, site_id, work_date, entry_time, leave_time, 
    breaks, leave_type, worked_hours, sunday_hours, ot_hours
) VALUES (
    '1006', 
    'SITE_DEFAULT', 
    '2025-11-25', 
    '15:00:00', 
    '2025-11-26T00:00:00',
    '[{"break_start": "19:00", "break_end": "20:00"}]',
    NULL,
    8.0,
    0.0,
    0.0
) ON CONFLICT (worker_id, work_date) DO UPDATE SET
    entry_time = EXCLUDED.entry_time,
    leave_time = EXCLUDED.leave_time,
    breaks = EXCLUDED.breaks,
    worked_hours = EXCLUDED.worked_hours,
    sunday_hours = EXCLUDED.sunday_hours,
    ot_hours = EXCLUDED.ot_hours;

-- Shift 26: Wed 26/11/25 - 15:00 to 0:00 next day, 1 hour break (9 hours total - 1 break = 8 hours)
INSERT INTO shifts (
    worker_id, site_id, work_date, entry_time, leave_time, 
    breaks, leave_type, worked_hours, sunday_hours, ot_hours
) VALUES (
    '1006', 
    'SITE_DEFAULT', 
    '2025-11-26', 
    '15:00:00', 
    '2025-11-27T00:00:00',
    '[{"break_start": "19:00", "break_end": "20:00"}]',
    NULL,
    8.0,
    0.0,
    0.0
) ON CONFLICT (worker_id, work_date) DO UPDATE SET
    entry_time = EXCLUDED.entry_time,
    leave_time = EXCLUDED.leave_time,
    breaks = EXCLUDED.breaks,
    worked_hours = EXCLUDED.worked_hours,
    sunday_hours = EXCLUDED.sunday_hours,
    ot_hours = EXCLUDED.ot_hours;

-- Shift 27: Thu 27/11/25 - 15:00 to 0:00 next day, 1 hour break (9 hours total - 1 break = 8 hours)
INSERT INTO shifts (
    worker_id, site_id, work_date, entry_time, leave_time, 
    breaks, leave_type, worked_hours, sunday_hours, ot_hours
) VALUES (
    '1006', 
    'SITE_DEFAULT', 
    '2025-11-27', 
    '15:00:00', 
    '2025-11-28T00:00:00',
    '[{"break_start": "19:00", "break_end": "20:00"}]',
    NULL,
    8.0,
    0.0,
    0.0
) ON CONFLICT (worker_id, work_date) DO UPDATE SET
    entry_time = EXCLUDED.entry_time,
    leave_time = EXCLUDED.leave_time,
    breaks = EXCLUDED.breaks,
    worked_hours = EXCLUDED.worked_hours,
    sunday_hours = EXCLUDED.sunday_hours,
    ot_hours = EXCLUDED.ot_hours;

-- Shift 28: Fri 28/11/25 - 15:00 to 0:00 next day, 1 hour break (9 hours total - 1 break = 8 hours)
INSERT INTO shifts (
    worker_id, site_id, work_date, entry_time, leave_time, 
    breaks, leave_type, worked_hours, sunday_hours, ot_hours
) VALUES (
    '1006', 
    'SITE_DEFAULT', 
    '2025-11-28', 
    '15:00:00', 
    '2025-11-29T00:00:00',
    '[{"break_start": "19:00", "break_end": "20:00"}]',
    NULL,
    8.0,
    0.0,
    0.0
) ON CONFLICT (worker_id, work_date) DO UPDATE SET
    entry_time = EXCLUDED.entry_time,
    leave_time = EXCLUDED.leave_time,
    breaks = EXCLUDED.breaks,
    worked_hours = EXCLUDED.worked_hours,
    sunday_hours = EXCLUDED.sunday_hours,
    ot_hours = EXCLUDED.ot_hours;

-- Shift 29: Sat 29/11/25 - 20:00 to 8:00 next day, 1 hour break (12 hours total - 1 break = 11 hours)
INSERT INTO shifts (
    worker_id, site_id, work_date, entry_time, leave_time, 
    breaks, leave_type, worked_hours, sunday_hours, ot_hours
) VALUES (
    '1006', 
    'SITE_DEFAULT', 
    '2025-11-29', 
    '20:00:00', 
    '2025-11-30T08:00:00',
    '[{"break_start": "00:00", "break_end": "01:00"}]',
    NULL,
    8.0,
    0.0,
    3.0
) ON CONFLICT (worker_id, work_date) DO UPDATE SET
    entry_time = EXCLUDED.entry_time,
    leave_time = EXCLUDED.leave_time,
    breaks = EXCLUDED.breaks,
    worked_hours = EXCLUDED.worked_hours,
    sunday_hours = EXCLUDED.sunday_hours,
    ot_hours = EXCLUDED.ot_hours;

-- Shift 30: Sun 30/11/25 - 20:00 to 8:00 next day, 1 hour break (12 hours total - 1 break = 11 hours, Sunday rates for 8 hours)
INSERT INTO shifts (
    worker_id, site_id, work_date, entry_time, leave_time, 
    breaks, leave_type, worked_hours, sunday_hours, ot_hours
) VALUES (
    '1006', 
    'SITE_DEFAULT', 
    '2025-11-30', 
    '20:00:00', 
    '2025-12-01T08:00:00',
    '[{"break_start": "00:00", "break_end": "01:00"}]',
    NULL,
    0.0,
    8.0,
    3.0
) ON CONFLICT (worker_id, work_date) DO UPDATE SET
    entry_time = EXCLUDED.entry_time,
    leave_time = EXCLUDED.leave_time,
    breaks = EXCLUDED.breaks,
    worked_hours = EXCLUDED.worked_hours,
    sunday_hours = EXCLUDED.sunday_hours,
    ot_hours = EXCLUDED.ot_hours;
