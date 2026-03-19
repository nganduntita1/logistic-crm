-- Multi-tenant organization model with one active organization per user.

CREATE TABLE organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  owner_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE org_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('owner', 'admin', 'operator', 'driver')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (org_id, user_id),
  UNIQUE (user_id)
);

CREATE INDEX idx_org_members_org_id ON org_members(org_id);
CREATE INDEX idx_org_members_user_id ON org_members(user_id);

CREATE TRIGGER update_organizations_updated_at BEFORE UPDATE ON organizations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

ALTER TABLE clients ADD COLUMN org_id UUID REFERENCES organizations(id) ON DELETE CASCADE;
ALTER TABLE receivers ADD COLUMN org_id UUID REFERENCES organizations(id) ON DELETE CASCADE;
ALTER TABLE vehicles ADD COLUMN org_id UUID REFERENCES organizations(id) ON DELETE CASCADE;
ALTER TABLE drivers ADD COLUMN org_id UUID REFERENCES organizations(id) ON DELETE CASCADE;
ALTER TABLE trips ADD COLUMN org_id UUID REFERENCES organizations(id) ON DELETE CASCADE;
ALTER TABLE shipments ADD COLUMN org_id UUID REFERENCES organizations(id) ON DELETE CASCADE;
ALTER TABLE driver_locations ADD COLUMN org_id UUID REFERENCES organizations(id) ON DELETE CASCADE;
ALTER TABLE delivery_proofs ADD COLUMN org_id UUID REFERENCES organizations(id) ON DELETE CASCADE;
ALTER TABLE shipment_status_history ADD COLUMN org_id UUID REFERENCES organizations(id) ON DELETE CASCADE;

CREATE INDEX idx_clients_org_id ON clients(org_id);
CREATE INDEX idx_receivers_org_id ON receivers(org_id);
CREATE INDEX idx_vehicles_org_id ON vehicles(org_id);
CREATE INDEX idx_drivers_org_id ON drivers(org_id);
CREATE INDEX idx_trips_org_id ON trips(org_id);
CREATE INDEX idx_shipments_org_id ON shipments(org_id);
CREATE INDEX idx_driver_locations_org_id ON driver_locations(org_id);
CREATE INDEX idx_delivery_proofs_org_id ON delivery_proofs(org_id);
CREATE INDEX idx_shipment_status_history_org_id ON shipment_status_history(org_id);

ALTER TABLE vehicles DROP CONSTRAINT IF EXISTS vehicles_plate_number_key;
ALTER TABLE drivers DROP CONSTRAINT IF EXISTS drivers_license_number_key;
ALTER TABLE drivers DROP CONSTRAINT IF EXISTS drivers_passport_number_key;

CREATE UNIQUE INDEX idx_vehicles_org_plate_number ON vehicles(org_id, plate_number);
CREATE UNIQUE INDEX idx_drivers_org_license_number ON drivers(org_id, license_number);
CREATE UNIQUE INDEX idx_drivers_org_passport_number ON drivers(org_id, passport_number);

DO $$
DECLARE
  legacy_org_id UUID;
  legacy_owner_id UUID;
BEGIN
  SELECT id INTO legacy_owner_id FROM profiles ORDER BY created_at ASC LIMIT 1;

  INSERT INTO organizations (name, slug, owner_id)
  VALUES ('Legacy Workspace', 'legacy-workspace', legacy_owner_id)
  ON CONFLICT (slug) DO UPDATE SET slug = EXCLUDED.slug
  RETURNING id INTO legacy_org_id;

  UPDATE clients SET org_id = legacy_org_id WHERE org_id IS NULL;
  UPDATE receivers SET org_id = legacy_org_id WHERE org_id IS NULL;
  UPDATE vehicles SET org_id = legacy_org_id WHERE org_id IS NULL;
  UPDATE drivers SET org_id = legacy_org_id WHERE org_id IS NULL;
  UPDATE trips SET org_id = legacy_org_id WHERE org_id IS NULL;
  UPDATE shipments SET org_id = legacy_org_id WHERE org_id IS NULL;
  UPDATE driver_locations dl
  SET org_id = d.org_id
  FROM drivers d
  WHERE d.id = dl.driver_id AND dl.org_id IS NULL;
  UPDATE delivery_proofs dp
  SET org_id = s.org_id
  FROM shipments s
  WHERE s.id = dp.shipment_id AND dp.org_id IS NULL;
  UPDATE shipment_status_history ssh
  SET org_id = s.org_id
  FROM shipments s
  WHERE s.id = ssh.shipment_id AND ssh.org_id IS NULL;

  INSERT INTO org_members (org_id, user_id, role)
  SELECT
    legacy_org_id,
    p.id,
    CASE p.role
      WHEN 'admin' THEN 'owner'
      WHEN 'driver' THEN 'driver'
      ELSE 'operator'
    END
  FROM profiles p
  ON CONFLICT (user_id) DO NOTHING;
END $$;

ALTER TABLE clients ALTER COLUMN org_id SET NOT NULL;
ALTER TABLE receivers ALTER COLUMN org_id SET NOT NULL;
ALTER TABLE vehicles ALTER COLUMN org_id SET NOT NULL;
ALTER TABLE drivers ALTER COLUMN org_id SET NOT NULL;
ALTER TABLE trips ALTER COLUMN org_id SET NOT NULL;
ALTER TABLE shipments ALTER COLUMN org_id SET NOT NULL;
ALTER TABLE driver_locations ALTER COLUMN org_id SET NOT NULL;
ALTER TABLE delivery_proofs ALTER COLUMN org_id SET NOT NULL;
ALTER TABLE shipment_status_history ALTER COLUMN org_id SET NOT NULL;

CREATE OR REPLACE FUNCTION current_user_org_id()
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT org_id
  FROM public.org_members
  WHERE user_id = auth.uid()
  ORDER BY created_at ASC
  LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION sync_org_id_from_parent()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_TABLE_NAME = 'driver_locations' THEN
    SELECT org_id INTO NEW.org_id
    FROM drivers
    WHERE id = NEW.driver_id;
  ELSIF TG_TABLE_NAME = 'delivery_proofs' THEN
    SELECT org_id INTO NEW.org_id
    FROM shipments
    WHERE id = NEW.shipment_id;
  ELSIF TG_TABLE_NAME = 'shipment_status_history' THEN
    SELECT org_id INTO NEW.org_id
    FROM shipments
    WHERE id = NEW.shipment_id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION validate_org_relationships()
RETURNS TRIGGER AS $$
DECLARE
  related_org_id UUID;
BEGIN
  IF TG_TABLE_NAME = 'drivers' AND NEW.vehicle_id IS NOT NULL THEN
    SELECT org_id INTO related_org_id FROM vehicles WHERE id = NEW.vehicle_id;
    IF related_org_id IS NULL OR related_org_id <> NEW.org_id THEN
      RAISE EXCEPTION 'Vehicle must belong to the same organization as the driver';
    END IF;
  ELSIF TG_TABLE_NAME = 'trips' THEN
    IF NEW.driver_id IS NOT NULL THEN
      SELECT org_id INTO related_org_id FROM drivers WHERE id = NEW.driver_id;
      IF related_org_id IS NULL OR related_org_id <> NEW.org_id THEN
        RAISE EXCEPTION 'Driver must belong to the same organization as the trip';
      END IF;
    END IF;

    IF NEW.vehicle_id IS NOT NULL THEN
      SELECT org_id INTO related_org_id FROM vehicles WHERE id = NEW.vehicle_id;
      IF related_org_id IS NULL OR related_org_id <> NEW.org_id THEN
        RAISE EXCEPTION 'Vehicle must belong to the same organization as the trip';
      END IF;
    END IF;
  ELSIF TG_TABLE_NAME = 'shipments' THEN
    SELECT org_id INTO related_org_id FROM clients WHERE id = NEW.client_id;
    IF related_org_id IS NULL OR related_org_id <> NEW.org_id THEN
      RAISE EXCEPTION 'Client must belong to the same organization as the shipment';
    END IF;

    SELECT org_id INTO related_org_id FROM receivers WHERE id = NEW.receiver_id;
    IF related_org_id IS NULL OR related_org_id <> NEW.org_id THEN
      RAISE EXCEPTION 'Receiver must belong to the same organization as the shipment';
    END IF;

    IF NEW.trip_id IS NOT NULL THEN
      SELECT org_id INTO related_org_id FROM trips WHERE id = NEW.trip_id;
      IF related_org_id IS NULL OR related_org_id <> NEW.org_id THEN
        RAISE EXCEPTION 'Trip must belong to the same organization as the shipment';
      END IF;
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER sync_driver_locations_org_id BEFORE INSERT OR UPDATE ON driver_locations
  FOR EACH ROW EXECUTE FUNCTION sync_org_id_from_parent();

CREATE TRIGGER sync_delivery_proofs_org_id BEFORE INSERT OR UPDATE ON delivery_proofs
  FOR EACH ROW EXECUTE FUNCTION sync_org_id_from_parent();

CREATE TRIGGER sync_shipment_status_history_org_id BEFORE INSERT OR UPDATE ON shipment_status_history
  FOR EACH ROW EXECUTE FUNCTION sync_org_id_from_parent();

CREATE TRIGGER validate_driver_org_relationships BEFORE INSERT OR UPDATE ON drivers
  FOR EACH ROW EXECUTE FUNCTION validate_org_relationships();

CREATE TRIGGER validate_trip_org_relationships BEFORE INSERT OR UPDATE ON trips
  FOR EACH ROW EXECUTE FUNCTION validate_org_relationships();

CREATE TRIGGER validate_shipment_org_relationships BEFORE INSERT OR UPDATE ON shipments
  FOR EACH ROW EXECUTE FUNCTION validate_org_relationships();

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE org_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE receivers ENABLE ROW LEVEL SECURITY;
ALTER TABLE vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE drivers ENABLE ROW LEVEL SECURITY;
ALTER TABLE trips ENABLE ROW LEVEL SECURITY;
ALTER TABLE shipments ENABLE ROW LEVEL SECURITY;
ALTER TABLE driver_locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE delivery_proofs ENABLE ROW LEVEL SECURITY;
ALTER TABLE shipment_status_history ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS profiles_select_same_org ON profiles;
CREATE POLICY profiles_select_same_org ON profiles
  FOR SELECT
  USING (
    id = auth.uid()
    OR EXISTS (
      SELECT 1
      FROM org_members viewer
      JOIN org_members target ON viewer.org_id = target.org_id
      WHERE viewer.user_id = auth.uid() AND target.user_id = profiles.id
    )
  );

DROP POLICY IF EXISTS profiles_update_self ON profiles;
CREATE POLICY profiles_update_self ON profiles
  FOR UPDATE
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

DROP POLICY IF EXISTS organizations_select_current_org ON organizations;
CREATE POLICY organizations_select_current_org ON organizations
  FOR SELECT
  USING (id = current_user_org_id());

DROP POLICY IF EXISTS org_members_select_own_membership ON org_members;
CREATE POLICY org_members_select_own_membership ON org_members
  FOR SELECT
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS clients_org_isolation_select ON clients;
CREATE POLICY clients_org_isolation_select ON clients FOR SELECT USING (org_id = current_user_org_id());
DROP POLICY IF EXISTS clients_org_isolation_insert ON clients;
CREATE POLICY clients_org_isolation_insert ON clients FOR INSERT WITH CHECK (org_id = current_user_org_id());
DROP POLICY IF EXISTS clients_org_isolation_update ON clients;
CREATE POLICY clients_org_isolation_update ON clients FOR UPDATE USING (org_id = current_user_org_id()) WITH CHECK (org_id = current_user_org_id());
DROP POLICY IF EXISTS clients_org_isolation_delete ON clients;
CREATE POLICY clients_org_isolation_delete ON clients FOR DELETE USING (org_id = current_user_org_id());

DROP POLICY IF EXISTS receivers_org_isolation_select ON receivers;
CREATE POLICY receivers_org_isolation_select ON receivers FOR SELECT USING (org_id = current_user_org_id());
DROP POLICY IF EXISTS receivers_org_isolation_insert ON receivers;
CREATE POLICY receivers_org_isolation_insert ON receivers FOR INSERT WITH CHECK (org_id = current_user_org_id());
DROP POLICY IF EXISTS receivers_org_isolation_update ON receivers;
CREATE POLICY receivers_org_isolation_update ON receivers FOR UPDATE USING (org_id = current_user_org_id()) WITH CHECK (org_id = current_user_org_id());
DROP POLICY IF EXISTS receivers_org_isolation_delete ON receivers;
CREATE POLICY receivers_org_isolation_delete ON receivers FOR DELETE USING (org_id = current_user_org_id());

DROP POLICY IF EXISTS vehicles_org_isolation_select ON vehicles;
CREATE POLICY vehicles_org_isolation_select ON vehicles FOR SELECT USING (org_id = current_user_org_id());
DROP POLICY IF EXISTS vehicles_org_isolation_insert ON vehicles;
CREATE POLICY vehicles_org_isolation_insert ON vehicles FOR INSERT WITH CHECK (org_id = current_user_org_id());
DROP POLICY IF EXISTS vehicles_org_isolation_update ON vehicles;
CREATE POLICY vehicles_org_isolation_update ON vehicles FOR UPDATE USING (org_id = current_user_org_id()) WITH CHECK (org_id = current_user_org_id());
DROP POLICY IF EXISTS vehicles_org_isolation_delete ON vehicles;
CREATE POLICY vehicles_org_isolation_delete ON vehicles FOR DELETE USING (org_id = current_user_org_id());

DROP POLICY IF EXISTS drivers_org_isolation_select ON drivers;
CREATE POLICY drivers_org_isolation_select ON drivers FOR SELECT USING (org_id = current_user_org_id());
DROP POLICY IF EXISTS drivers_org_isolation_insert ON drivers;
CREATE POLICY drivers_org_isolation_insert ON drivers FOR INSERT WITH CHECK (org_id = current_user_org_id());
DROP POLICY IF EXISTS drivers_org_isolation_update ON drivers;
CREATE POLICY drivers_org_isolation_update ON drivers FOR UPDATE USING (org_id = current_user_org_id()) WITH CHECK (org_id = current_user_org_id());
DROP POLICY IF EXISTS drivers_org_isolation_delete ON drivers;
CREATE POLICY drivers_org_isolation_delete ON drivers FOR DELETE USING (org_id = current_user_org_id());

DROP POLICY IF EXISTS trips_org_isolation_select ON trips;
CREATE POLICY trips_org_isolation_select ON trips FOR SELECT USING (org_id = current_user_org_id());
DROP POLICY IF EXISTS trips_org_isolation_insert ON trips;
CREATE POLICY trips_org_isolation_insert ON trips FOR INSERT WITH CHECK (org_id = current_user_org_id());
DROP POLICY IF EXISTS trips_org_isolation_update ON trips;
CREATE POLICY trips_org_isolation_update ON trips FOR UPDATE USING (org_id = current_user_org_id()) WITH CHECK (org_id = current_user_org_id());
DROP POLICY IF EXISTS trips_org_isolation_delete ON trips;
CREATE POLICY trips_org_isolation_delete ON trips FOR DELETE USING (org_id = current_user_org_id());

DROP POLICY IF EXISTS shipments_org_isolation_select ON shipments;
CREATE POLICY shipments_org_isolation_select ON shipments FOR SELECT USING (org_id = current_user_org_id());
DROP POLICY IF EXISTS shipments_org_isolation_insert ON shipments;
CREATE POLICY shipments_org_isolation_insert ON shipments FOR INSERT WITH CHECK (org_id = current_user_org_id());
DROP POLICY IF EXISTS shipments_org_isolation_update ON shipments;
CREATE POLICY shipments_org_isolation_update ON shipments FOR UPDATE USING (org_id = current_user_org_id()) WITH CHECK (org_id = current_user_org_id());
DROP POLICY IF EXISTS shipments_org_isolation_delete ON shipments;
CREATE POLICY shipments_org_isolation_delete ON shipments FOR DELETE USING (org_id = current_user_org_id());

DROP POLICY IF EXISTS driver_locations_org_isolation_select ON driver_locations;
CREATE POLICY driver_locations_org_isolation_select ON driver_locations FOR SELECT USING (org_id = current_user_org_id());
DROP POLICY IF EXISTS driver_locations_org_isolation_insert ON driver_locations;
CREATE POLICY driver_locations_org_isolation_insert ON driver_locations FOR INSERT WITH CHECK (org_id = current_user_org_id());
DROP POLICY IF EXISTS driver_locations_org_isolation_update ON driver_locations;
CREATE POLICY driver_locations_org_isolation_update ON driver_locations FOR UPDATE USING (org_id = current_user_org_id()) WITH CHECK (org_id = current_user_org_id());
DROP POLICY IF EXISTS driver_locations_org_isolation_delete ON driver_locations;
CREATE POLICY driver_locations_org_isolation_delete ON driver_locations FOR DELETE USING (org_id = current_user_org_id());

DROP POLICY IF EXISTS delivery_proofs_org_isolation_select ON delivery_proofs;
CREATE POLICY delivery_proofs_org_isolation_select ON delivery_proofs FOR SELECT USING (org_id = current_user_org_id());
DROP POLICY IF EXISTS delivery_proofs_org_isolation_insert ON delivery_proofs;
CREATE POLICY delivery_proofs_org_isolation_insert ON delivery_proofs FOR INSERT WITH CHECK (org_id = current_user_org_id());
DROP POLICY IF EXISTS delivery_proofs_org_isolation_update ON delivery_proofs;
CREATE POLICY delivery_proofs_org_isolation_update ON delivery_proofs FOR UPDATE USING (org_id = current_user_org_id()) WITH CHECK (org_id = current_user_org_id());
DROP POLICY IF EXISTS delivery_proofs_org_isolation_delete ON delivery_proofs;
CREATE POLICY delivery_proofs_org_isolation_delete ON delivery_proofs FOR DELETE USING (org_id = current_user_org_id());

DROP POLICY IF EXISTS shipment_status_history_org_isolation_select ON shipment_status_history;
CREATE POLICY shipment_status_history_org_isolation_select ON shipment_status_history FOR SELECT USING (org_id = current_user_org_id());
DROP POLICY IF EXISTS shipment_status_history_org_isolation_insert ON shipment_status_history;
CREATE POLICY shipment_status_history_org_isolation_insert ON shipment_status_history FOR INSERT WITH CHECK (org_id = current_user_org_id());
DROP POLICY IF EXISTS shipment_status_history_org_isolation_update ON shipment_status_history;
CREATE POLICY shipment_status_history_org_isolation_update ON shipment_status_history FOR UPDATE USING (org_id = current_user_org_id()) WITH CHECK (org_id = current_user_org_id());
DROP POLICY IF EXISTS shipment_status_history_org_isolation_delete ON shipment_status_history;
CREATE POLICY shipment_status_history_org_isolation_delete ON shipment_status_history FOR DELETE USING (org_id = current_user_org_id());

CREATE OR REPLACE FUNCTION get_latest_driver_locations()
RETURNS TABLE (
  driver_id UUID,
  driver_name TEXT,
  latitude NUMERIC,
  longitude NUMERIC,
  "timestamp" TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT DISTINCT ON (dl.driver_id)
    dl.driver_id,
    p.full_name AS driver_name,
    dl.latitude,
    dl.longitude,
    dl.timestamp
  FROM driver_locations dl
  JOIN drivers d ON d.id = dl.driver_id
  JOIN profiles p ON p.id = d.user_id
  WHERE d.status = 'active'
    AND dl.org_id = current_user_org_id()
  ORDER BY dl.driver_id, dl.timestamp DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION get_latest_driver_locations() TO authenticated;