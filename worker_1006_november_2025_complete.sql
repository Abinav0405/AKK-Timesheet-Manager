-- Complete SQL for worker 1006 November 2025 shifts
-- With entry/exit times, calculated break timings, and all hour values

-- Shift 1: Sat 1/11/25 - 23:00 to 8:00 next day, 1 hour break, 0 OT, 8 working hours
INSERT INTO shifts (worker_id, site_id, work_date, entry_time, leave_time, lunch_start, lunch_end, break_hours, has_left, worked_hours, sunday_hours, ot_hours) 
VALUES ('1006', 'SITE_DEFAULT', '2025-11-01', '2025-11-01T23:00:00', '2025-11-02T08:00:00', '2025-11-02T02:00:00', '2025-11-02T03:00:00', 1.0, true, 8.0, 0.0, 0.0)
ON CONFLICT (worker_id, work_date) DO UPDATE SET
    site_id = EXCLUDED.site_id,
    entry_time = EXCLUDED.entry_time,
    leave_time = EXCLUDED.leave_time,
    lunch_start = EXCLUDED.lunch_start,
    lunch_end = EXCLUDED.lunch_end,
    break_hours = EXCLUDED.break_hours,
    has_left = EXCLUDED.has_left,
    worked_hours = EXCLUDED.worked_hours,
    sunday_hours = EXCLUDED.sunday_hours,
    ot_hours = EXCLUDED.ot_hours;

-- Shift 2: Sun 2/11/25 - 23:00 to 8:00 next day, 1 hour break, 8 Sunday hours
INSERT INTO shifts (worker_id, site_id, work_date, entry_time, leave_time, lunch_start, lunch_end, break_hours, has_left, worked_hours, sunday_hours, ot_hours) 
VALUES ('1006', 'SITE_DEFAULT', '2025-11-02', '2025-11-02T23:00:00', '2025-11-03T08:00:00', '2025-11-03T02:00:00', '2025-11-03T03:00:00', 1.0, true, 0.0, 8.0, 0.0)
ON CONFLICT (worker_id, work_date) DO UPDATE SET
    site_id = EXCLUDED.site_id,
    entry_time = EXCLUDED.entry_time,
    leave_time = EXCLUDED.leave_time,
    lunch_start = EXCLUDED.lunch_start,
    lunch_end = EXCLUDED.lunch_end,
    break_hours = EXCLUDED.break_hours,
    has_left = EXCLUDED.has_left,
    worked_hours = EXCLUDED.worked_hours,
    sunday_hours = EXCLUDED.sunday_hours,
    ot_hours = EXCLUDED.ot_hours;

-- Shift 3: Mon 3/11/25 - 23:00 to 8:00 next day, 1 hour break, 0 OT, 8 working hours
INSERT INTO shifts (worker_id, site_id, work_date, entry_time, leave_time, lunch_start, lunch_end, break_hours, has_left, worked_hours, sunday_hours, ot_hours) 
VALUES ('1006', 'SITE_DEFAULT', '2025-11-03', '2025-11-03T23:00:00', '2025-11-04T08:00:00', '2025-11-04T02:00:00', '2025-11-04T03:00:00', 1.0, true, 8.0, 0.0, 0.0)
ON CONFLICT (worker_id, work_date) DO UPDATE SET
    site_id = EXCLUDED.site_id,
    entry_time = EXCLUDED.entry_time,
    leave_time = EXCLUDED.leave_time,
    lunch_start = EXCLUDED.lunch_start,
    lunch_end = EXCLUDED.lunch_end,
    break_hours = EXCLUDED.break_hours,
    has_left = EXCLUDED.has_left,
    worked_hours = EXCLUDED.worked_hours,
    sunday_hours = EXCLUDED.sunday_hours,
    ot_hours = EXCLUDED.ot_hours;

-- Shift 4: Tue 4/11/25 - 23:00 to 8:00 next day, 1 hour break, 0 OT, 8 working hours
INSERT INTO shifts (worker_id, site_id, work_date, entry_time, leave_time, lunch_start, lunch_end, break_hours, has_left, worked_hours, sunday_hours, ot_hours) 
VALUES ('1006', 'SITE_DEFAULT', '2025-11-04', '2025-11-04T23:00:00', '2025-11-05T08:00:00', '2025-11-05T02:00:00', '2025-11-05T03:00:00', 1.0, true, 8.0, 0.0, 0.0)
ON CONFLICT (worker_id, work_date) DO UPDATE SET
    site_id = EXCLUDED.site_id,
    entry_time = EXCLUDED.entry_time,
    leave_time = EXCLUDED.leave_time,
    lunch_start = EXCLUDED.lunch_start,
    lunch_end = EXCLUDED.lunch_end,
    break_hours = EXCLUDED.break_hours,
    has_left = EXCLUDED.has_left,
    worked_hours = EXCLUDED.worked_hours,
    sunday_hours = EXCLUDED.sunday_hours,
    ot_hours = EXCLUDED.ot_hours;

-- Shift 5: Wed 5/11/25 - 23:00 to 8:00 next day, 1 hour break, 0 OT, 8 working hours
INSERT INTO shifts (worker_id, work_date, entry_time, leave_time, lunch_start, lunch_end, break_hours, has_left, worked_hours, sunday_hours, ot_hours) 
VALUES ('1006', '2025-11-05', '2025-11-05T23:00:00', '2025-11-06T08:00:00', '2025-11-06T02:00:00', '2025-11-06T03:00:00', 1.0, true, 8.0, 0.0, 0.0);

-- Shift 6: Thu 6/11/25 - 23:00 to 8:00 next day, 1 hour break, 0 OT, 8 working hours
INSERT INTO shifts (worker_id, work_date, entry_time, leave_time, lunch_start, lunch_end, break_hours, has_left, worked_hours, sunday_hours, ot_hours) 
VALUES ('1006', '2025-11-06', '2025-11-06T23:00:00', '2025-11-07T08:00:00', '2025-11-07T02:00:00', '2025-11-07T03:00:00', 1.0, true, 8.0, 0.0, 0.0);

-- Shift 7: Fri 7/11/25 - 23:00 to 8:00 next day, 1 hour break, 0 OT, 8 working hours
INSERT INTO shifts (worker_id, work_date, entry_time, leave_time, lunch_start, lunch_end, break_hours, has_left, worked_hours, sunday_hours, ot_hours) 
VALUES ('1006', '2025-11-07', '2025-11-07T23:00:00', '2025-11-08T08:00:00', '2025-11-08T02:00:00', '2025-11-08T03:00:00', 1.0, true, 8.0, 0.0, 0.0);

-- Shift 8: Sat 8/11/25 - 23:00 to 8:00 next day, 1 hour break, 0 OT, 8 working hours
INSERT INTO shifts (worker_id, work_date, entry_time, leave_time, lunch_start, lunch_end, break_hours, has_left, worked_hours, sunday_hours, ot_hours) 
VALUES ('1006', '2025-11-08', '2025-11-08T23:00:00', '2025-11-09T08:00:00', '2025-11-09T02:00:00', '2025-11-09T03:00:00', 1.0, true, 8.0, 0.0, 0.0);

-- Shift 9: Sun 9/11/25 - 23:00 to 8:00 next day, 1 hour break, 8 Sunday hours
INSERT INTO shifts (worker_id, work_date, entry_time, leave_time, lunch_start, lunch_end, break_hours, has_left, worked_hours, sunday_hours, ot_hours) 
VALUES ('1006', '2025-11-09', '2025-11-09T23:00:00', '2025-11-10T08:00:00', '2025-11-10T02:00:00', '2025-11-10T03:00:00', 1.0, true, 0.0, 8.0, 0.0);

-- Shift 10: Mon 10/11/25 - 23:00 to 8:00 next day, 1 hour break, 0 OT, 8 working hours
INSERT INTO shifts (worker_id, work_date, entry_time, leave_time, lunch_start, lunch_end, break_hours, has_left, worked_hours, sunday_hours, ot_hours) 
VALUES ('1006', '2025-11-10', '2025-11-10T23:00:00', '2025-11-11T08:00:00', '2025-11-11T02:00:00', '2025-11-11T03:00:00', 1.0, true, 8.0, 0.0, 0.0);

-- Shift 11: Tue 11/11/25 - 23:00 to 8:00 next day, 1 hour break, 0 OT, 8 working hours
INSERT INTO shifts (worker_id, work_date, entry_time, leave_time, lunch_start, lunch_end, break_hours, has_left, worked_hours, sunday_hours, ot_hours) 
VALUES ('1006', '2025-11-11', '2025-11-11T23:00:00', '2025-11-12T08:00:00', '2025-11-12T02:00:00', '2025-11-12T03:00:00', 1.0, true, 8.0, 0.0, 0.0);

-- Shift 12: Wed 12/11/25 - 23:00 to 8:00 next day, 1 hour break, 0 OT, 8 working hours
INSERT INTO shifts (worker_id, work_date, entry_time, leave_time, lunch_start, lunch_end, break_hours, has_left, worked_hours, sunday_hours, ot_hours) 
VALUES ('1006', '2025-11-12', '2025-11-12T23:00:00', '2025-11-13T08:00:00', '2025-11-13T02:00:00', '2025-11-13T03:00:00', 1.0, true, 8.0, 0.0, 0.0);

-- Shift 13: Thu 13/11/25 - 23:00 to 8:00 next day, 1 hour break, 0 OT, 8 working hours
INSERT INTO shifts (worker_id, work_date, entry_time, leave_time, lunch_start, lunch_end, break_hours, has_left, worked_hours, sunday_hours, ot_hours) 
VALUES ('1006', '2025-11-13', '2025-11-13T23:00:00', '2025-11-14T08:00:00', '2025-11-14T02:00:00', '2025-11-14T03:00:00', 1.0, true, 8.0, 0.0, 0.0);

-- Shift 14: Fri 14/11/25 - 23:00 to 8:00 next day, 1 hour break, 0 OT, 8 working hours
INSERT INTO shifts (worker_id, work_date, entry_time, leave_time, lunch_start, lunch_end, break_hours, has_left, worked_hours, sunday_hours, ot_hours) 
VALUES ('1006', '2025-11-14', '2025-11-14T23:00:00', '2025-11-15T08:00:00', '2025-11-15T02:00:00', '2025-11-15T03:00:00', 1.0, true, 8.0, 0.0, 0.0);

-- Shift 15: Sat 15/11/25 - 23:00 to 8:00 next day, 1 hour break, 0 OT, 8 working hours
INSERT INTO shifts (worker_id, work_date, entry_time, leave_time, lunch_start, lunch_end, break_hours, has_left, worked_hours, sunday_hours, ot_hours) 
VALUES ('1006', '2025-11-15', '2025-11-15T23:00:00', '2025-11-16T08:00:00', '2025-11-16T02:00:00', '2025-11-16T03:00:00', 1.0, true, 8.0, 0.0, 0.0);

-- Shift 16: Sun 16/11/25 - 23:00 to 8:00 next day, 1 hour break, 8 Sunday hours
INSERT INTO shifts (worker_id, work_date, entry_time, leave_time, lunch_start, lunch_end, break_hours, has_left, worked_hours, sunday_hours, ot_hours) 
VALUES ('1006', '2025-11-16', '2025-11-16T23:00:00', '2025-11-17T08:00:00', '2025-11-17T02:00:00', '2025-11-17T03:00:00', 1.0, true, 0.0, 8.0, 0.0);

-- Shift 17: Mon 17/11/25 - 15:00 to 0:00 next day, 1 hour break, 0 OT, 8 working hours
INSERT INTO shifts (worker_id, work_date, entry_time, leave_time, lunch_start, lunch_end, break_hours, has_left, worked_hours, sunday_hours, ot_hours) 
VALUES ('1006', '2025-11-17', '2025-11-17T15:00:00', '2025-11-18T00:00:00', '2025-11-17T19:00:00', '2025-11-17T20:00:00', 1.0, true, 8.0, 0.0, 0.0);

-- Shift 18: Tue 18/11/25 - 15:00 to 0:00 next day, 1 hour break, 0 OT, 8 working hours
INSERT INTO shifts (worker_id, work_date, entry_time, leave_time, lunch_start, lunch_end, break_hours, has_left, worked_hours, sunday_hours, ot_hours) 
VALUES ('1006', '2025-11-18', '2025-11-18T15:00:00', '2025-11-19T00:00:00', '2025-11-18T19:00:00', '2025-11-18T20:00:00', 1.0, true, 8.0, 0.0, 0.0);

-- Shift 19: Wed 19/11/25 - 15:00 to 0:00 next day, 1 hour break, 0 OT, 8 working hours
INSERT INTO shifts (worker_id, work_date, entry_time, leave_time, lunch_start, lunch_end, break_hours, has_left, worked_hours, sunday_hours, ot_hours) 
VALUES ('1006', '2025-11-19', '2025-11-19T15:00:00', '2025-11-20T00:00:00', '2025-11-19T19:00:00', '2025-11-19T20:00:00', 1.0, true, 8.0, 0.0, 0.0);

-- Shift 20: Thu 20/11/25 - 15:00 to 0:00 next day, 1 hour break, 0 OT, 8 working hours
INSERT INTO shifts (worker_id, work_date, entry_time, leave_time, lunch_start, lunch_end, break_hours, has_left, worked_hours, sunday_hours, ot_hours) 
VALUES ('1006', '2025-11-20', '2025-11-20T15:00:00', '2025-11-21T00:00:00', '2025-11-20T19:00:00', '2025-11-20T20:00:00', 1.0, true, 8.0, 0.0, 0.0);

-- Shift 21: Fri 21/11/25 - 15:00 to 8:00 next day, 2 hour breaks, 7 OT, 15 working hours
INSERT INTO shifts (worker_id, work_date, entry_time, leave_time, lunch_start, lunch_end, break_hours, has_left, worked_hours, sunday_hours, ot_hours) 
VALUES ('1006', '2025-11-21', '2025-11-21T15:00:00', '2025-11-22T08:00:00', '2025-11-21T19:00:00', '2025-11-21T21:00:00', 2.0, true, 8.0, 0.0, 7.0);

-- Shift 22: Sat 22/11/25 - 15:00 to 0:00 next day, 1 hour break, 0 OT, 8 working hours
INSERT INTO shifts (worker_id, work_date, entry_time, leave_time, lunch_start, lunch_end, break_hours, has_left, worked_hours, sunday_hours, ot_hours) 
VALUES ('1006', '2025-11-22', '2025-11-22T15:00:00', '2025-11-23T00:00:00', '2025-11-22T19:00:00', '2025-11-22T20:00:00', 1.0, true, 8.0, 0.0, 0.0);

-- Shift 23: Sun 23/11/25 - 15:00 to 8:00 next day, 2 hour breaks, 15 Sunday hours
INSERT INTO shifts (worker_id, work_date, entry_time, leave_time, lunch_start, lunch_end, break_hours, has_left, worked_hours, sunday_hours, ot_hours) 
VALUES ('1006', '2025-11-23', '2025-11-23T15:00:00', '2025-11-24T08:00:00', '2025-11-23T19:00:00', '2025-11-23T21:00:00', 2.0, true, 0.0, 8.0, 7.0);

-- Shift 24: Mon 24/11/25 - 15:00 to 0:00 next day, 2 hour breaks, 0 OT, 7 working hours
INSERT INTO shifts (worker_id, work_date, entry_time, leave_time, lunch_start, lunch_end, break_hours, has_left, worked_hours, sunday_hours, ot_hours) 
VALUES ('1006', '2025-11-24', '2025-11-24T15:00:00', '2025-11-25T00:00:00', '2025-11-24T18:00:00', '2025-11-24T20:00:00', 2.0, true, 7.0, 0.0, 0.0);

-- Shift 25: Tue 25/11/25 - 15:00 to 0:00 next day, 1 hour break, 0 OT, 8 working hours
INSERT INTO shifts (worker_id, work_date, entry_time, leave_time, lunch_start, lunch_end, break_hours, has_left, worked_hours, sunday_hours, ot_hours) 
VALUES ('1006', '2025-11-25', '2025-11-25T15:00:00', '2025-11-26T00:00:00', '2025-11-25T19:00:00', '2025-11-25T20:00:00', 1.0, true, 8.0, 0.0, 0.0);

-- Shift 26: Wed 26/11/25 - 15:00 to 0:00 next day, 1 hour break, 0 OT, 8 working hours
INSERT INTO shifts (worker_id, work_date, entry_time, leave_time, lunch_start, lunch_end, break_hours, has_left, worked_hours, sunday_hours, ot_hours) 
VALUES ('1006', '2025-11-26', '2025-11-26T15:00:00', '2025-11-27T00:00:00', '2025-11-26T19:00:00', '2025-11-26T20:00:00', 1.0, true, 8.0, 0.0, 0.0);

-- Shift 27: Thu 27/11/25 - 15:00 to 0:00 next day, 1 hour break, 0 OT, 8 working hours
INSERT INTO shifts (worker_id, work_date, entry_time, leave_time, lunch_start, lunch_end, break_hours, has_left, worked_hours, sunday_hours, ot_hours) 
VALUES ('1006', '2025-11-27', '2025-11-27T15:00:00', '2025-11-28T00:00:00', '2025-11-27T19:00:00', '2025-11-27T20:00:00', 1.0, true, 8.0, 0.0, 0.0);

-- Shift 28: Fri 28/11/25 - 15:00 to 0:00 next day, 1 hour break, 0 OT, 8 working hours
INSERT INTO shifts (worker_id, work_date, entry_time, leave_time, lunch_start, lunch_end, break_hours, has_left, worked_hours, sunday_hours, ot_hours) 
VALUES ('1006', '2025-11-28', '2025-11-28T15:00:00', '2025-11-29T00:00:00', '2025-11-28T19:00:00', '2025-11-28T20:00:00', 1.0, true, 8.0, 0.0, 0.0);

-- Shift 29: Sat 29/11/25 - 20:00 to 8:00 next day, 1 hour break, 3 OT, 11 working hours
INSERT INTO shifts (worker_id, work_date, entry_time, leave_time, lunch_start, lunch_end, break_hours, has_left, worked_hours, sunday_hours, ot_hours) 
VALUES ('1006', '2025-11-29', '2025-11-29T20:00:00', '2025-11-30T08:00:00', '2025-11-30T00:00:00', '2025-11-30T01:00:00', 1.0, true, 8.0, 0.0, 3.0);

-- Shift 30: Sun 30/11/25 - 20:00 to 8:00 next day, 1 hour break, 11 Sunday hours
INSERT INTO shifts (worker_id, work_date, entry_time, leave_time, lunch_start, lunch_end, break_hours, has_left, worked_hours, sunday_hours, ot_hours) 
VALUES ('1006', '2025-11-30', '2025-11-30T20:00:00', '2025-12-01T08:00:00', '2025-12-01T00:00:00', '2025-12-01T01:00:00', 1.0, true, 0.0, 8.0, 3.0);
