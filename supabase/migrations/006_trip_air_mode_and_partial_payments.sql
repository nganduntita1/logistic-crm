-- Add partial payment tracking and air-trip support.

-- Hotfix for partially migrated databases that still have the older
-- validate_org_relationships function referencing NEW.vehicle_id
-- outside table-specific branches.
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

ALTER TABLE shipments
ADD COLUMN IF NOT EXISTS amount_paid NUMERIC NOT NULL DEFAULT 0;

UPDATE shipments
SET amount_paid = CASE
  WHEN payment_status = 'paid' THEN price
  WHEN payment_status = 'partial' THEN ROUND(price * 0.5, 2)
  ELSE 0
END;

ALTER TABLE shipments
DROP CONSTRAINT IF EXISTS shipments_amount_paid_valid;

ALTER TABLE shipments
ADD CONSTRAINT shipments_amount_paid_valid CHECK (
  amount_paid >= 0
  AND amount_paid <= price
  AND (
    (payment_status = 'unpaid' AND amount_paid = 0)
    OR (payment_status = 'partial' AND amount_paid > 0 AND amount_paid < price)
    OR (payment_status = 'paid' AND amount_paid = price)
  )
);

ALTER TABLE trips
ADD COLUMN IF NOT EXISTS transport_mode TEXT NOT NULL DEFAULT 'road',
ADD COLUMN IF NOT EXISTS air_origin TEXT,
ADD COLUMN IF NOT EXISTS air_destination TEXT,
ADD COLUMN IF NOT EXISTS air_eta_days INTEGER;

ALTER TABLE trips
DROP CONSTRAINT IF EXISTS trips_transport_mode_valid;

ALTER TABLE trips
ADD CONSTRAINT trips_transport_mode_valid CHECK (transport_mode IN ('road', 'air'));

ALTER TABLE trips
DROP CONSTRAINT IF EXISTS trips_air_mode_fields_valid;

ALTER TABLE trips
ADD CONSTRAINT trips_air_mode_fields_valid CHECK (
  (
    transport_mode = 'road'
    AND air_origin IS NULL
    AND air_destination IS NULL
    AND air_eta_days IS NULL
  )
  OR (
    transport_mode = 'air'
    AND air_origin IS NOT NULL
    AND air_destination IS NOT NULL
    AND air_eta_days IN (1, 2)
    AND driver_id IS NULL
    AND vehicle_id IS NULL
  )
);
