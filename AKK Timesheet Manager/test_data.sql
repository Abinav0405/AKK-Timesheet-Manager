-- AKK Timesheet Manager - Worker Profiles and Sites
-- Run this in Supabase SQL Editor
-- This adds worker profiles and real sites (no test shift data)

-- Delete all existing test data first
DELETE FROM shifts WHERE worker_id IN ('1001', '1002', '1003', '1006', '1007', '1009', '1011', '1013', '1015', '1022', '1024', '1025', '1026', '1027', '1029', '1030', '1031', '1032', '1033', '1035', '1037', '1038', '1039', '1041', '1043', '1047', '1048', '1050', '1052');
DELETE FROM workers WHERE worker_id IN ('1001', '1002', '1003', '1006', '1007', '1009', '1011', '1013', '1015', '1022', '1024', '1025', '1026', '1027', '1029', '1030', '1031', '1032', '1033', '1035', '1037', '1038', '1039', '1041', '1043', '1047', '1048', '1050', '1052');
DELETE FROM sites WHERE qr_token IN ('SITE_A_TOKEN', 'SITE_B_TOKEN', 'SITE_C_TOKEN', 'SITE_D_TOKEN', 'SITE_E_TOKEN', 'SITE_OFFICE_TOKEN', 'SITE_415C_TOKEN');

-- Insert actual worker profiles
INSERT INTO workers (worker_id, name, password_hash) VALUES
('1001', 'SAMIDURAI ARUMUGAM', '$2a$10$default.hash.1001'),
('1002', 'ARUMUGAM USHA', '$2a$10$default.hash.1002'),
('1003', 'ARUMUGAM ABINAV', '$2a$10$default.hash.1003'),
('1006', 'GANESAN VENGATESAN', '$2a$10$default.hash.1006'),
('1007', 'RAMASAMY RAMESH', '$2a$10$default.hash.1007'),
('1009', 'MAHENDIRAN VENKATESAN', '$2a$10$default.hash.1009'),
('1011', 'ANTHONISAGAYARAJ REMI', '$2a$10$default.hash.1011'),
('1013', 'KHOLIL MD EBRAHIM', '$2a$10$default.hash.1013'),
('1015', 'ANNADURAI ANBUDURAI', '$2a$10$default.hash.1015'),
('1022', 'PULENDRAN PRAKASH', '$2a$10$default.hash.1022'),
('1024', 'BALAKRISHNAN SATHIYAMOORTHY', '$2a$10$default.hash.1024'),
('1025', 'CHELLADURAI CHINRAJ', '$2a$10$default.hash.1025'),
('1026', 'RAJARAM ARUNPRAKASH', '$2a$10$default.hash.1026'),
('1027', 'KARUPPAIAH VELMURUGAN', '$2a$10$default.hash.1027'),
('1029', 'MURUGESAN RASALINGAM', '$2a$10$default.hash.1029'),
('1030', 'GOVINDHAN MURUGANANTHAM', '$2a$10$default.hash.1030'),
('1031', 'ELANGOVAN SATHISH', '$2a$10$default.hash.1031'),
('1032', 'GANESAN SANGILIMUTHU', '$2a$10$default.hash.1032'),
('1033', 'AROCKIASAMY AROKIA JOHNSON JACKAB', '$2a$10$default.hash.1033'),
('1035', 'GOPAL KABILAN', '$2a$10$default.hash.1035'),
('1037', 'ELANGOVEN RAJARAJAN', '$2a$10$default.hash.1037'),
('1038', 'MUTHUKRISHNAN VEMBARASAN', '$2a$10$default.hash.1038'),
('1039', 'NATH SREE UBENDRA', '$2a$10$default.hash.1039'),
('1041', 'MANI RAJA', '$2a$10$default.hash.1041'),
('1043', 'ARUMUGAM MUTHUCHAMY', '$2a$10$default.hash.1043'),
('1047', 'GUNASEKARAN BHARATHI', '$2a$10$default.hash.1047'),
('1048', 'KARUPPIAH SURESHKUMAR', '$2a$10$default.hash.1048'),
('1050', 'ARUNACHALAM PILLAI SUBASHCHANDRABOSE', '$2a$10$default.hash.1050'),
('1052', 'PUGAZHENTHI AKASH', '$2a$10$default.hash.1052')
ON CONFLICT (worker_id) DO UPDATE SET
    name = EXCLUDED.name,
    password_hash = EXCLUDED.password_hash;

-- Insert real sites with ACCURATE coordinates
INSERT INTO sites (site_name, latitude, longitude, qr_token) VALUES
('Office', 1.3347, 103.9050, 'SITE_OFFICE_TOKEN'), -- 15 Kaki Bukit Rd 4, #01-50, Singapore 417808
('415C Fernvale', 1.3908, 103.8973, 'SITE_415C_TOKEN') -- 415C Fernvale Link, Singapore 793415
ON CONFLICT (qr_token) DO NOTHING;

-- Site Mappings:
-- SITE_OFFICE_TOKEN -> Office (15 Kaki Bukit Rd 4, #01-50, Singapore 417808)
-- SITE_415C_TOKEN -> 415C Fernvale (415C Fernvale Link, Singapore 793415)
