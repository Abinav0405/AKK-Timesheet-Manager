-- ========================================
-- ADD SITE LOCATIONS FOR PRODUCTION
-- Run this SQL in Supabase after running production_clean_setup.sql
-- ========================================

-- First, add the qr_token column to sites table if it doesn't exist
ALTER TABLE sites ADD COLUMN IF NOT EXISTS qr_token TEXT;

-- Insert site locations with QR tokens
INSERT INTO sites (id, site_name, latitude, longitude, qr_token) VALUES
('415c', '415c Construction Site', 1.3893916491439324, 103.88050290014863, 'SITE_415C_TOKEN'),
('office', 'Kaki Bukit Office', 1.3392899533456875, 103.9114000437236, 'SITE_OFFICE_TOKEN')
ON CONFLICT (id) DO UPDATE SET
  site_name = EXCLUDED.site_name,
  latitude = EXCLUDED.latitude,
  longitude = EXCLUDED.longitude,
  qr_token = EXCLUDED.qr_token;

-- ========================================
-- QR CODE CONTENT FOR EACH SITE
-- ========================================
--
-- Generate QR codes with the following plain text content:
--
-- For 415c Construction Site:
-- SITE_415C_TOKEN
--
-- For Kaki Bukit Office:
-- SITE_OFFICE_TOKEN
--
-- The QR codes should contain this plain text token.
-- The application will validate these tokens against the sites table.
