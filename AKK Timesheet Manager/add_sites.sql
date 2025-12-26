-- ========================================
-- ADD SITE LOCATIONS FOR PRODUCTION
-- Run this SQL in Supabase after running production_clean_setup.sql
-- ========================================

-- Insert site locations
INSERT INTO sites (id, site_name, latitude, longitude) VALUES
('415c', '415c Construction Site', 1.3893916491439324, 103.88050290014863),
('office', 'Kaki Bukit Office', 1.3392899533456875, 103.9114000437236);

-- ========================================
-- QR CODE CONTENT FOR EACH SITE
-- ========================================
--
-- Generate QR codes with the following JSON content:
--
-- For 415c Construction Site:
-- {"siteId":"415c","name":"415c Construction Site","token":"AKK2025_415C"}
--
-- For Kaki Bukit Office:
-- {"siteId":"office","name":"Kaki Bukit Office","token":"AKK2025_OFFICE"}
--
-- The QR codes should contain this JSON data as plain text or encoded.
-- The application will parse this JSON to extract site information and validate the token.
