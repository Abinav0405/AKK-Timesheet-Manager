-- Drop existing triggers if they exist
DROP TRIGGER IF EXISTS trigger_auto_update_shift_hours_insert ON shifts;
DROP TRIGGER IF EXISTS trigger_auto_update_shift_hours_update ON shifts;

-- Create function to automatically calculate and update shift hours
CREATE OR REPLACE FUNCTION auto_update_shift_hours()
RETURNS TRIGGER AS $$
DECLARE
    v_basic_hours numeric;
    v_sunday_hours numeric;
    v_ot_hours numeric;
    v_total_hours numeric;
    v_working_hours numeric;
BEGIN
    -- Only calculate if entry_time and leave_time are provided and has_left is true
    IF NEW.entry_time IS NOT NULL AND NEW.leave_time IS NOT NULL AND NEW.has_left = true THEN
        -- Calculate total hours and working hours (excluding breaks)
        v_total_hours := EXTRACT(EPOCH FROM (NEW.leave_time - NEW.entry_time)) / 3600;
        v_working_hours := v_total_hours - COALESCE(NEW.break_hours, 0);
        
        -- Check if it's Sunday
        IF EXTRACT(DOW FROM NEW.work_date) = 0 THEN
            -- Sunday: all working hours go to sunday_hours
            v_sunday_hours := v_working_hours;
            v_basic_hours := 0;
            v_ot_hours := 0;
        ELSE
            -- Weekday: basic hours max 8, excess goes to OT
            IF v_working_hours > 8 THEN
                v_basic_hours := 8;
                v_ot_hours := v_working_hours - 8;
            ELSE
                v_basic_hours := v_working_hours;
                v_ot_hours := 0;
            END IF;
            v_sunday_hours := 0;
        END IF;
        
        -- Update NEW record with calculated values (rounded to 1 decimal place)
        NEW.worked_hours := ROUND(v_basic_hours, 1);
        NEW.sunday_hours := ROUND(v_sunday_hours, 1);
        NEW.ot_hours := ROUND(v_ot_hours, 1);
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for INSERT operations
CREATE TRIGGER trigger_auto_update_shift_hours_insert
    BEFORE INSERT ON shifts
    FOR EACH ROW
    EXECUTE FUNCTION auto_update_shift_hours();

-- Create trigger for UPDATE operations
CREATE TRIGGER trigger_auto_update_shift_hours_update
    BEFORE UPDATE ON shifts
    FOR EACH ROW
    EXECUTE FUNCTION auto_update_shift_hours();

-- Test the trigger with a sample shift
-- INSERT INTO shifts (
--     worker_id, site_id, work_date, entry_time, leave_time, 
--     lunch_start, lunch_end, break_hours, has_left
-- ) VALUES (
--     '1006', 
--     'SITE_DEFAULT', 
--     '2025-12-01', 
--     '2025-12-01T23:00:00', 
--     '2025-12-02T08:00:00', 
--     '2025-12-02T02:00:00', 
--     '2025-12-02T03:00:00', 
--     1.0, 
--     true
-- );

-- Check if the trigger worked
-- SELECT * FROM shifts WHERE worker_id = '1006' AND work_date = '2025-12-01';
