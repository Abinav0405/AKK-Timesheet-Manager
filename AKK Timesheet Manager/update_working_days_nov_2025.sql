-- Update working days for November 2025 to 25 days
UPDATE working_days_config
SET working_days = 25
WHERE year = 2025 AND month = 11;
