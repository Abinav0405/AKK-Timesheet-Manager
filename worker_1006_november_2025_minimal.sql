-- Minimal SQL for worker 1006 November 2025 shifts
-- Using only essential columns that are likely to exist
-- Run check_shifts_table_columns.sql first to verify actual column names

-- Shift 1: Sat 1/11/25 - 23:00 to 8:00 next day
INSERT INTO shifts (worker_id, work_date, entry_time, leave_time) 
VALUES ('1006', '2025-11-01', '23:00:00', '2025-11-02T08:00:00')
ON CONFLICT (worker_id, work_date) DO UPDATE SET
    entry_time = EXCLUDED.entry_time,
    leave_time = EXCLUDED.leave_time;

-- Shift 2: Sun 2/11/25 - 23:00 to 8:00 next day
INSERT INTO shifts (worker_id, work_date, entry_time, leave_time) 
VALUES ('1006', '2025-11-02', '23:00:00', '2025-11-03T08:00:00')
ON CONFLICT (worker_id, work_date) DO UPDATE SET
    entry_time = EXCLUDED.entry_time,
    leave_time = EXCLUDED.leave_time;

-- Shift 3: Mon 3/11/25 - 23:00 to 8:00 next day
INSERT INTO shifts (worker_id, work_date, entry_time, leave_time) 
VALUES ('1006', '2025-11-03', '23:00:00', '2025-11-04T08:00:00')
ON CONFLICT (worker_id, work_date) DO UPDATE SET
    entry_time = EXCLUDED.entry_time,
    leave_time = EXCLUDED.leave_time;

-- Shift 4: Tue 4/11/25 - 23:00 to 8:00 next day
INSERT INTO shifts (worker_id, work_date, entry_time, leave_time) 
VALUES ('1006', '2025-11-04', '23:00:00', '2025-11-05T08:00:00')
ON CONFLICT (worker_id, work_date) DO UPDATE SET
    entry_time = EXCLUDED.entry_time,
    leave_time = EXCLUDED.leave_time;

-- Shift 5: Wed 5/11/25 - 23:00 to 8:00 next day
INSERT INTO shifts (worker_id, work_date, entry_time, leave_time) 
VALUES ('1006', '2025-11-05', '23:00:00', '2025-11-06T08:00:00')
ON CONFLICT (worker_id, work_date) DO UPDATE SET
    entry_time = EXCLUDED.entry_time,
    leave_time = EXCLUDED.leave_time;

-- Shift 6: Thu 6/11/25 - 23:00 to 8:00 next day
INSERT INTO shifts (worker_id, work_date, entry_time, leave_time) 
VALUES ('1006', '2025-11-06', '23:00:00', '2025-11-07T08:00:00')
ON CONFLICT (worker_id, work_date) DO UPDATE SET
    entry_time = EXCLUDED.entry_time,
    leave_time = EXCLUDED.leave_time;

-- Shift 7: Fri 7/11/25 - 23:00 to 8:00 next day
INSERT INTO shifts (worker_id, work_date, entry_time, leave_time) 
VALUES ('1006', '2025-11-07', '23:00:00', '2025-11-08T08:00:00')
ON CONFLICT (worker_id, work_date) DO UPDATE SET
    entry_time = EXCLUDED.entry_time,
    leave_time = EXCLUDED.leave_time;

-- Shift 8: Sat 8/11/25 - 23:00 to 8:00 next day
INSERT INTO shifts (worker_id, work_date, entry_time, leave_time) 
VALUES ('1006', '2025-11-08', '23:00:00', '2025-11-09T08:00:00')
ON CONFLICT (worker_id, work_date) DO UPDATE SET
    entry_time = EXCLUDED.entry_time,
    leave_time = EXCLUDED.leave_time;

-- Shift 9: Sun 9/11/25 - 23:00 to 8:00 next day
INSERT INTO shifts (worker_id, work_date, entry_time, leave_time) 
VALUES ('1006', '2025-11-09', '23:00:00', '2025-11-10T08:00:00')
ON CONFLICT (worker_id, work_date) DO UPDATE SET
    entry_time = EXCLUDED.entry_time,
    leave_time = EXCLUDED.leave_time;

-- Shift 10: Mon 10/11/25 - 23:00 to 8:00 next day
INSERT INTO shifts (worker_id, work_date, entry_time, leave_time) 
VALUES ('1006', '2025-11-10', '23:00:00', '2025-11-11T08:00:00')
ON CONFLICT (worker_id, work_date) DO UPDATE SET
    entry_time = EXCLUDED.entry_time,
    leave_time = EXCLUDED.leave_time;

-- Shift 11: Tue 11/11/25 - 23:00 to 8:00 next day
INSERT INTO shifts (worker_id, work_date, entry_time, leave_time) 
VALUES ('1006', '2025-11-11', '23:00:00', '2025-11-12T08:00:00')
ON CONFLICT (worker_id, work_date) DO UPDATE SET
    entry_time = EXCLUDED.entry_time,
    leave_time = EXCLUDED.leave_time;

-- Shift 12: Wed 12/11/25 - 23:00 to 8:00 next day
INSERT INTO shifts (worker_id, work_date, entry_time, leave_time) 
VALUES ('1006', '2025-11-12', '23:00:00', '2025-11-13T08:00:00')
ON CONFLICT (worker_id, work_date) DO UPDATE SET
    entry_time = EXCLUDED.entry_time,
    leave_time = EXCLUDED.leave_time;

-- Shift 13: Thu 13/11/25 - 23:00 to 8:00 next day
INSERT INTO shifts (worker_id, work_date, entry_time, leave_time) 
VALUES ('1006', '2025-11-13', '23:00:00', '2025-11-14T08:00:00')
ON CONFLICT (worker_id, work_date) DO UPDATE SET
    entry_time = EXCLUDED.entry_time,
    leave_time = EXCLUDED.leave_time;

-- Shift 14: Fri 14/11/25 - 23:00 to 8:00 next day
INSERT INTO shifts (worker_id, work_date, entry_time, leave_time) 
VALUES ('1006', '2025-11-14', '23:00:00', '2025-11-15T08:00:00')
ON CONFLICT (worker_id, work_date) DO UPDATE SET
    entry_time = EXCLUDED.entry_time,
    leave_time = EXCLUDED.leave_time;

-- Shift 15: Sat 15/11/25 - 23:00 to 8:00 next day
INSERT INTO shifts (worker_id, work_date, entry_time, leave_time) 
VALUES ('1006', '2025-11-15', '23:00:00', '2025-11-16T08:00:00')
ON CONFLICT (worker_id, work_date) DO UPDATE SET
    entry_time = EXCLUDED.entry_time,
    leave_time = EXCLUDED.leave_time;

-- Shift 16: Sun 16/11/25 - 23:00 to 8:00 next day
INSERT INTO shifts (worker_id, work_date, entry_time, leave_time) 
VALUES ('1006', '2025-11-16', '23:00:00', '2025-11-17T08:00:00')
ON CONFLICT (worker_id, work_date) DO UPDATE SET
    entry_time = EXCLUDED.entry_time,
    leave_time = EXCLUDED.leave_time;

-- Shift 17: Mon 17/11/25 - 15:00 to 0:00 next day
INSERT INTO shifts (worker_id, work_date, entry_time, leave_time) 
VALUES ('1006', '2025-11-17', '15:00:00', '2025-11-18T00:00:00')
ON CONFLICT (worker_id, work_date) DO UPDATE SET
    entry_time = EXCLUDED.entry_time,
    leave_time = EXCLUDED.leave_time;

-- Shift 18: Tue 18/11/25 - 15:00 to 0:00 next day
INSERT INTO shifts (worker_id, work_date, entry_time, leave_time) 
VALUES ('1006', '2025-11-18', '15:00:00', '2025-11-19T00:00:00')
ON CONFLICT (worker_id, work_date) DO UPDATE SET
    entry_time = EXCLUDED.entry_time,
    leave_time = EXCLUDED.leave_time;

-- Shift 19: Wed 19/11/25 - 15:00 to 0:00 next day
INSERT INTO shifts (worker_id, work_date, entry_time, leave_time) 
VALUES ('1006', '2025-11-19', '15:00:00', '2025-11-20T00:00:00')
ON CONFLICT (worker_id, work_date) DO UPDATE SET
    entry_time = EXCLUDED.entry_time,
    leave_time = EXCLUDED.leave_time;

-- Shift 20: Thu 20/11/25 - 15:00 to 0:00 next day
INSERT INTO shifts (worker_id, work_date, entry_time, leave_time) 
VALUES ('1006', '2025-11-20', '15:00:00', '2025-11-21T00:00:00')
ON CONFLICT (worker_id, work_date) DO UPDATE SET
    entry_time = EXCLUDED.entry_time,
    leave_time = EXCLUDED.leave_time;

-- Shift 21: Fri 21/11/25 - 15:00 to 8:00 next day
INSERT INTO shifts (worker_id, work_date, entry_time, leave_time) 
VALUES ('1006', '2025-11-21', '15:00:00', '2025-11-22T08:00:00')
ON CONFLICT (worker_id, work_date) DO UPDATE SET
    entry_time = EXCLUDED.entry_time,
    leave_time = EXCLUDED.leave_time;

-- Shift 22: Sat 22/11/25 - 15:00 to 0:00 next day
INSERT INTO shifts (worker_id, work_date, entry_time, leave_time) 
VALUES ('1006', '2025-11-22', '15:00:00', '2025-11-23T00:00:00')
ON CONFLICT (worker_id, work_date) DO UPDATE SET
    entry_time = EXCLUDED.entry_time,
    leave_time = EXCLUDED.leave_time;

-- Shift 23: Sun 23/11/25 - 15:00 to 8:00 next day
INSERT INTO shifts (worker_id, work_date, entry_time, leave_time) 
VALUES ('1006', '2025-11-23', '15:00:00', '2025-11-24T08:00:00')
ON CONFLICT (worker_id, work_date) DO UPDATE SET
    entry_time = EXCLUDED.entry_time,
    leave_time = EXCLUDED.leave_time;

-- Shift 24: Mon 24/11/25 - 15:00 to 0:00 next day
INSERT INTO shifts (worker_id, work_date, entry_time, leave_time) 
VALUES ('1006', '2025-11-24', '15:00:00', '2025-11-25T00:00:00')
ON CONFLICT (worker_id, work_date) DO UPDATE SET
    entry_time = EXCLUDED.entry_time,
    leave_time = EXCLUDED.leave_time;

-- Shift 25: Tue 25/11/25 - 15:00 to 0:00 next day
INSERT INTO shifts (worker_id, work_date, entry_time, leave_time) 
VALUES ('1006', '2025-11-25', '15:00:00', '2025-11-26T00:00:00')
ON CONFLICT (worker_id, work_date) DO UPDATE SET
    entry_time = EXCLUDED.entry_time,
    leave_time = EXCLUDED.leave_time;

-- Shift 26: Wed 26/11/25 - 15:00 to 0:00 next day
INSERT INTO shifts (worker_id, work_date, entry_time, leave_time) 
VALUES ('1006', '2025-11-26', '15:00:00', '2025-11-27T00:00:00')
ON CONFLICT (worker_id, work_date) DO UPDATE SET
    entry_time = EXCLUDED.entry_time,
    leave_time = EXCLUDED.leave_time;

-- Shift 27: Thu 27/11/25 - 15:00 to 0:00 next day
INSERT INTO shifts (worker_id, work_date, entry_time, leave_time) 
VALUES ('1006', '2025-11-27', '15:00:00', '2025-11-28T00:00:00')
ON CONFLICT (worker_id, work_date) DO UPDATE SET
    entry_time = EXCLUDED.entry_time,
    leave_time = EXCLUDED.leave_time;

-- Shift 28: Fri 28/11/25 - 15:00 to 0:00 next day
INSERT INTO shifts (worker_id, work_date, entry_time, leave_time) 
VALUES ('1006', '2025-11-28', '15:00:00', '2025-11-29T00:00:00')
ON CONFLICT (worker_id, work_date) DO UPDATE SET
    entry_time = EXCLUDED.entry_time,
    leave_time = EXCLUDED.leave_time;

-- Shift 29: Sat 29/11/25 - 20:00 to 8:00 next day
INSERT INTO shifts (worker_id, work_date, entry_time, leave_time) 
VALUES ('1006', '2025-11-29', '20:00:00', '2025-11-30T08:00:00')
ON CONFLICT (worker_id, work_date) DO UPDATE SET
    entry_time = EXCLUDED.entry_time,
    leave_time = EXCLUDED.leave_time;

-- Shift 30: Sun 30/11/25 - 20:00 to 8:00 next day
INSERT INTO shifts (worker_id, work_date, entry_time, leave_time) 
VALUES ('1006', '2025-11-30', '20:00:00', '2025-12-01T08:00:00')
ON CONFLICT (worker_id, work_date) DO UPDATE SET
    entry_time = EXCLUDED.entry_time,
    leave_time = EXCLUDED.leave_time;
