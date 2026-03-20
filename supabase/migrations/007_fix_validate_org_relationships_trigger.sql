-- Dedicated hotfix migration for org relationship trigger function.
-- This is safe to run repeatedly and unblocks environments where 006
-- is already marked as applied but the old function body is still present.

CREATE OR REPLACE FUNCTION validate_org_relationships()
RETURNS TRIGGER AS $$
DECLARE
  related_org_id UUID;
BEGIN
  IF TG_TABLE_NAME = 'drivers' THEN
    IF NEW.vehicle_id IS NOT NULL THEN
      SELECT org_id INTO related_org_id FROM vehicles WHERE id = NEW.vehicle_id;
      IF related_org_id IS NULL OR related_org_id <> NEW.org_id THEN
        RAISE EXCEPTION 'Vehicle must belong to the same organization as the driver';
      END IF;
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
