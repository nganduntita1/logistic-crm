-- Seed data for Logistics CRM
-- This script populates the database with realistic dummy data for demo purposes

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM auth.users) THEN
    RAISE EXCEPTION 'No users found in auth.users. Create at least one user in Authentication > Users, then run seed.sql again.';
  END IF;
END $$;

-- ============================================================================
-- SEED PROFILES (Users)
-- ============================================================================
-- Build profiles from real auth.users to satisfy profiles.id -> auth.users.id FK.
WITH ranked_users AS (
  SELECT
    u.id,
    u.email,
    COALESCE(
      NULLIF(u.raw_user_meta_data->>'full_name', ''),
      INITCAP(REPLACE(SPLIT_PART(COALESCE(u.email, 'user@example.com'), '@', 1), '.', ' ')),
      'Demo User'
    ) AS full_name,
    ROW_NUMBER() OVER (ORDER BY u.created_at, u.id) AS rn
  FROM auth.users u
  WHERE u.email IS NOT NULL
)
INSERT INTO profiles (id, email, full_name, role, created_at, updated_at)
SELECT
  ru.id,
  ru.email,
  ru.full_name,
  CASE
    WHEN ru.rn = 1 THEN 'admin'
    WHEN ru.rn = 2 THEN 'operator'
    ELSE 'driver'
  END AS role,
  NOW(),
  NOW()
FROM ranked_users ru
ON CONFLICT (id) DO UPDATE
SET
  email = EXCLUDED.email,
  full_name = EXCLUDED.full_name,
  role = EXCLUDED.role,
  updated_at = NOW();

-- ============================================================================
-- SEED CLIENTS
-- ============================================================================
INSERT INTO clients (id, name, phone, whatsapp, email, address, city, country, notes, created_at, updated_at)
VALUES 
  ('10000000-0000-0000-0000-000000000001', 'FastFood Express', '+1-555-0101', '+1-555-0101', 'orders@fastfood.com', '123 Main St', 'New York', 'USA', 'Primary food supplier', NOW(), NOW()),
  ('10000000-0000-0000-0000-000000000002', 'Tech Solutions Inc', '+1-555-0102', '+1-555-0102', 'logistics@techsol.com', '456 Tech Ave', 'San Francisco', 'USA', 'Electronics distributor', NOW(), NOW()),
  ('10000000-0000-0000-0000-000000000003', 'Fashion Retail Co', '+1-555-0103', '+1-555-0103', 'shipping@fashionretail.com', '789 Style Blvd', 'Los Angeles', 'USA', 'Clothing distributor', NOW(), NOW()),
  ('10000000-0000-0000-0000-000000000004', 'Pharma Distribution', '+1-555-0104', '+1-555-0104', 'orders@pharma.com', '321 Medical Way', 'Chicago', 'USA', 'Pharmaceutical supplier', NOW(), NOW()),
  ('10000000-0000-0000-0000-000000000005', 'Furniture Plus', '+1-555-0105', '+1-555-0105', 'logistics@furniture.com', '654 Wood Lane', 'Houston', 'USA', 'Furniture distributor', NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- SEED RECEIVERS
-- ============================================================================
INSERT INTO receivers (id, name, phone, address, city, country, created_at, updated_at)
VALUES 
  ('20000000-0000-0000-0000-000000000001', 'Store Manager - Downtown', '+1-555-1001', '111 Park Ave', 'Manhattan', 'USA', NOW(), NOW()),
  ('20000000-0000-0000-0000-000000000002', 'Warehouse Lead - Port', '+1-555-1002', '222 Harbor St', 'Newark', 'USA', NOW(), NOW()),
  ('20000000-0000-0000-0000-000000000003', 'Distribution Center', '+1-555-1003', '333 Industrial Blvd', 'Jersey City', 'USA', NOW(), NOW()),
  ('20000000-0000-0000-0000-000000000004', 'Pick-up Point Store', '+1-555-1004', '444 Retail Park', 'Yonkers', 'USA', NOW(), NOW()),
  ('20000000-0000-0000-0000-000000000005', 'Customer B Warehouse', '+1-555-1005', '555 Commerce Way', 'Boston', 'USA', NOW(), NOW()),
  ('20000000-0000-0000-0000-000000000006', 'Regional Hub', '+1-555-1006', '666 Logistics Dr', 'Philadelphia', 'USA', NOW(), NOW()),
  ('20000000-0000-0000-0000-000000000007', 'Express Depot', '+1-555-1007', '777 Fast Lane', 'Washington', 'USA', NOW(), NOW()),
  ('20000000-0000-0000-0000-000000000008', 'Metro Station', '+1-555-1008', '888 Central Ave', 'Atlanta', 'USA', NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- SEED VEHICLES
-- ============================================================================
INSERT INTO vehicles (id, plate_number, type, capacity, insurance_expiry, status, created_at, updated_at)
VALUES 
  ('30000000-0000-0000-0000-000000000001', 'NYC-TRUCK-01', 'Box Truck', 5000.00, '2026-12-31', 'available', NOW(), NOW()),
  ('30000000-0000-0000-0000-000000000002', 'NYC-TRUCK-02', 'Box Truck', 5000.00, '2026-11-15', 'in_use', NOW(), NOW()),
  ('30000000-0000-0000-0000-000000000003', 'NYC-VAN-01', 'Van', 2000.00, '2026-08-20', 'available', NOW(), NOW()),
  ('30000000-0000-0000-0000-000000000004', 'NYC-VAN-02', 'Van', 2000.00, '2026-09-10', 'in_use', NOW(), NOW()),
  ('30000000-0000-0000-0000-000000000005', 'NYC-SEMI-01', 'Semi Truck', 20000.00, '2027-01-05', 'available', NOW(), NOW()),
  ('30000000-0000-0000-0000-000000000006', 'NYC-FLATBED-01', 'Flatbed', 8000.00, '2026-07-30', 'maintenance', NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- SEED DRIVERS
-- ============================================================================
WITH driver_profiles AS (
  SELECT
    p.id AS user_id,
    ROW_NUMBER() OVER (ORDER BY p.created_at, p.id) AS rn
  FROM profiles p
  WHERE p.role = 'driver'
),
vehicle_pool AS (
  SELECT
    v.id AS vehicle_id,
    ROW_NUMBER() OVER (ORDER BY v.created_at, v.id) AS rn
  FROM vehicles v
)
INSERT INTO drivers (id, user_id, license_number, passport_number, vehicle_id, status, created_at, updated_at)
SELECT
  uuid_generate_v5('6ba7b810-9dad-11d1-80b4-00c04fd430c8'::uuid, dp.user_id::text),
  dp.user_id,
  'DL-DEMO-' || UPPER(SUBSTRING(REPLACE(dp.user_id::text, '-', '') FROM 1 FOR 8)),
  'PP-DEMO-' || UPPER(SUBSTRING(REPLACE(dp.user_id::text, '-', '') FROM 9 FOR 8)),
  vp.vehicle_id,
  'active',
  NOW(),
  NOW()
FROM driver_profiles dp
LEFT JOIN vehicle_pool vp ON vp.rn = dp.rn
ON CONFLICT (id) DO UPDATE
SET
  vehicle_id = EXCLUDED.vehicle_id,
  status = EXCLUDED.status,
  updated_at = NOW();

-- ============================================================================
-- SEED DRIVER LOCATIONS
-- ============================================================================
WITH active_drivers AS (
  SELECT
    d.id AS driver_id,
    ROW_NUMBER() OVER (ORDER BY d.created_at, d.id) AS rn
  FROM drivers d
  WHERE d.status = 'active'
),
coords AS (
  SELECT *
  FROM (VALUES
    (1, 40.7128::numeric, -74.0060::numeric, INTERVAL '5 minutes'),
    (2, 40.6892::numeric, -74.0445::numeric, INTERVAL '3 minutes'),
    (3, 40.7589::numeric, -73.9851::numeric, INTERVAL '10 minutes')
  ) AS c(rn, latitude, longitude, age)
)
INSERT INTO driver_locations (id, driver_id, latitude, longitude, timestamp, created_at)
SELECT
  uuid_generate_v5('6ba7b811-9dad-11d1-80b4-00c04fd430c8'::uuid, ad.driver_id::text || '-latest'),
  ad.driver_id,
  c.latitude,
  c.longitude,
  NOW() - c.age,
  NOW()
FROM active_drivers ad
JOIN coords c ON c.rn = ad.rn
WHERE NOT EXISTS (
  SELECT 1
  FROM driver_locations dl
  WHERE dl.driver_id = ad.driver_id
);

-- ============================================================================
-- SEED TRIPS
-- ============================================================================
WITH driver_pool AS (
  SELECT d.id, ROW_NUMBER() OVER (ORDER BY d.created_at, d.id) AS rn
  FROM drivers d
),
vehicle_pool AS (
  SELECT v.id, ROW_NUMBER() OVER (ORDER BY v.created_at, v.id) AS rn
  FROM vehicles v
)
INSERT INTO trips (id, route, departure_date, expected_arrival, driver_id, vehicle_id, status, created_at, updated_at)
VALUES
  (
    '60000000-0000-0000-0000-000000000001',
    'New York to Boston',
    CURRENT_DATE,
    CURRENT_DATE + INTERVAL '1 day',
    (SELECT id FROM driver_pool WHERE rn = 1),
    (SELECT id FROM vehicle_pool WHERE rn = 1),
    'in_progress',
    NOW(),
    NOW()
  ),
  (
    '60000000-0000-0000-0000-000000000002',
    'New York to Philadelphia',
    CURRENT_DATE - INTERVAL '1 day',
    CURRENT_DATE,
    (SELECT id FROM driver_pool WHERE rn = 2),
    (SELECT id FROM vehicle_pool WHERE rn = 2),
    'completed',
    NOW(),
    NOW()
  ),
  (
    '60000000-0000-0000-0000-000000000003',
    'New York to Washington DC',
    CURRENT_DATE + INTERVAL '2 days',
    CURRENT_DATE + INTERVAL '3 days',
    (SELECT id FROM driver_pool WHERE rn = 3),
    (SELECT id FROM vehicle_pool WHERE rn = 3),
    'planned',
    NOW(),
    NOW()
  ),
  (
    '60000000-0000-0000-0000-000000000004',
    'Boston to New York',
    CURRENT_DATE + INTERVAL '1 day',
    CURRENT_DATE + INTERVAL '2 days',
    (SELECT id FROM driver_pool WHERE rn = 1),
    (SELECT id FROM vehicle_pool WHERE rn = 1),
    'planned',
    NOW(),
    NOW()
  )
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- SEED SHIPMENTS
-- ============================================================================
INSERT INTO shipments (id, tracking_number, client_id, receiver_id, trip_id, description, quantity, weight, value, price, status, payment_status, created_at, updated_at)
VALUES 
  ('70000000-0000-0000-0000-000000000001', 'TRK-2026-NY-001', '10000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000001', '60000000-0000-0000-0000-000000000001', 'Fast Food Supplies - Fresh Ingredients', 50, 500.00, 5000.00, 1200.00, 'in_transit', 'paid', NOW() - INTERVAL '2 days', NOW()),
  ('70000000-0000-0000-0000-000000000002', 'TRK-2026-NY-002', '10000000-0000-0000-0000-000000000002', '20000000-0000-0000-0000-000000000002', '60000000-0000-0000-0000-000000000001', 'Electronics - Laptop Shipment', 25, 250.00, 50000.00, 8000.00, 'in_transit', 'paid', NOW() - INTERVAL '1 day', NOW()),
  ('70000000-0000-0000-0000-000000000003', 'TRK-2026-NY-003', '10000000-0000-0000-0000-000000000003', '20000000-0000-0000-0000-000000000003', '60000000-0000-0000-0000-000000000002', 'Clothing - Spring Collection', 100, 300.00, 15000.00, 3500.00, 'delivered', 'paid', NOW() - INTERVAL '3 days', NOW()),
  ('70000000-0000-0000-0000-000000000004', 'TRK-2026-NY-004', '10000000-0000-0000-0000-000000000004', '20000000-0000-0000-0000-000000000004', NULL, 'Pharmaceutical - Medical Supplies', 75, 400.00, 25000.00, 5000.00, 'pending', 'unpaid', NOW(), NOW()),
  ('70000000-0000-0000-0000-000000000005', 'TRK-2026-NY-005', '10000000-0000-0000-0000-000000000005', '20000000-0000-0000-0000-000000000005', NULL, 'Furniture - Office Desks', 15, 600.00, 12000.00, 2500.00, 'pending', 'unpaid', NOW(), NOW()),
  ('70000000-0000-0000-0000-000000000006', 'TRK-2026-NY-006', '10000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000006', '60000000-0000-0000-0000-000000000002', 'Fresh Produce - Mixed Items', 80, 450.00, 3000.00, 800.00, 'delivered', 'partial', NOW() - INTERVAL '4 days', NOW()),
  ('70000000-0000-0000-0000-000000000007', 'TRK-2026-NY-007', '10000000-0000-0000-0000-000000000002', '20000000-0000-0000-0000-000000000007', NULL, 'Electronics - Accessories Bundle', 200, 150.00, 8000.00, 2000.00, 'pending', 'unpaid', NOW(), NOW()),
  ('70000000-0000-0000-0000-000000000008', 'TRK-2026-NY-008', '10000000-0000-0000-0000-000000000003', '20000000-0000-0000-0000-000000000008', '60000000-0000-0000-0000-000000000002', 'Fashion - Summer Inventory', 150, 350.00, 22000.00, 4500.00, 'delivered', 'paid', NOW() - INTERVAL '5 days', NOW())
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- SEED DELIVERY PROOFS
-- ============================================================================
INSERT INTO delivery_proofs (id, shipment_id, receiver_name, photo_url, delivered_at, created_at)
VALUES 
  ('80000000-0000-0000-0000-000000000001', '70000000-0000-0000-0000-000000000003', 'Robert Chen', 'https://images.unsplash.com/photo-1516321318423-f06f70504c11?w=500&h=500', NOW() - INTERVAL '3 days', NOW() - INTERVAL '3 days'),
  ('80000000-0000-0000-0000-000000000002', '70000000-0000-0000-0000-000000000006', 'Maria Garcia', 'https://images.unsplash.com/photo-1516321318423-f06f70504c11?w=500&h=500', NOW() - INTERVAL '4 days', NOW() - INTERVAL '4 days'),
  ('80000000-0000-0000-0000-000000000003', '70000000-0000-0000-0000-000000000008', 'James Wilson', 'https://images.unsplash.com/photo-1516321318423-f06f70504c11?w=500&h=500', NOW() - INTERVAL '5 days', NOW() - INTERVAL '5 days')
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- SEED SHIPMENT STATUS HISTORY
-- ============================================================================
WITH actor AS (
  SELECT p.id
  FROM profiles p
  ORDER BY p.created_at, p.id
  LIMIT 1
),
history_rows AS (
  SELECT *
  FROM (VALUES
    ('90000000-0000-0000-0000-000000000001'::uuid, '70000000-0000-0000-0000-000000000001'::uuid, 'pending'::text, 'Shipment created'::text, INTERVAL '2 days'),
    ('90000000-0000-0000-0000-000000000002'::uuid, '70000000-0000-0000-0000-000000000001'::uuid, 'in_transit'::text, 'Picked up by driver'::text, INTERVAL '1 day'),
    ('90000000-0000-0000-0000-000000000003'::uuid, '70000000-0000-0000-0000-000000000002'::uuid, 'pending'::text, 'Shipment created'::text, INTERVAL '1 day'),
    ('90000000-0000-0000-0000-000000000004'::uuid, '70000000-0000-0000-0000-000000000002'::uuid, 'in_transit'::text, 'In transit to Boston'::text, INTERVAL '12 hours'),
    ('90000000-0000-0000-0000-000000000005'::uuid, '70000000-0000-0000-0000-000000000003'::uuid, 'pending'::text, 'Shipment created'::text, INTERVAL '3 days'),
    ('90000000-0000-0000-0000-000000000006'::uuid, '70000000-0000-0000-0000-000000000003'::uuid, 'in_transit'::text, 'Assigned to trip'::text, INTERVAL '2 days'),
    ('90000000-0000-0000-0000-000000000007'::uuid, '70000000-0000-0000-0000-000000000003'::uuid, 'delivered'::text, 'Successfully delivered'::text, INTERVAL '3 days'),
    ('90000000-0000-0000-0000-000000000008'::uuid, '70000000-0000-0000-0000-000000000004'::uuid, 'pending'::text, 'Shipment created'::text, INTERVAL '0 minutes'),
    ('90000000-0000-0000-0000-000000000009'::uuid, '70000000-0000-0000-0000-000000000006'::uuid, 'pending'::text, 'Shipment created'::text, INTERVAL '4 days'),
    ('90000000-0000-0000-0000-000000000010'::uuid, '70000000-0000-0000-0000-000000000006'::uuid, 'in_transit'::text, 'Assigned to trip'::text, INTERVAL '3 days'),
    ('90000000-0000-0000-0000-000000000011'::uuid, '70000000-0000-0000-0000-000000000006'::uuid, 'delivered'::text, 'Successfully delivered'::text, INTERVAL '4 days'),
    ('90000000-0000-0000-0000-000000000012'::uuid, '70000000-0000-0000-0000-000000000008'::uuid, 'pending'::text, 'Shipment created'::text, INTERVAL '5 days'),
    ('90000000-0000-0000-0000-000000000013'::uuid, '70000000-0000-0000-0000-000000000008'::uuid, 'in_transit'::text, 'Assigned to trip'::text, INTERVAL '4 days'),
    ('90000000-0000-0000-0000-000000000014'::uuid, '70000000-0000-0000-0000-000000000008'::uuid, 'delivered'::text, 'Successfully delivered'::text, INTERVAL '5 days')
  ) AS t(id, shipment_id, status, notes, age)
)
INSERT INTO shipment_status_history (id, shipment_id, status, changed_by, notes, created_at)
SELECT
  hr.id,
  hr.shipment_id,
  hr.status,
  a.id,
  hr.notes,
  NOW() - hr.age
FROM history_rows hr
CROSS JOIN actor a
ON CONFLICT (id) DO NOTHING;
