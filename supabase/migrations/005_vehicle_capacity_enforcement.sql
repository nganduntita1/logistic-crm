-- Enforce vehicle capacity limits for shipments assigned to trips.

CREATE OR REPLACE FUNCTION enforce_trip_vehicle_capacity_on_shipments()
RETURNS TRIGGER AS $$
DECLARE
  vehicle_capacity NUMERIC;
  vehicle_plate TEXT;
  trip_route TEXT;
  existing_load NUMERIC;
  projected_load NUMERIC;
BEGIN
  IF NEW.trip_id IS NULL THEN
    RETURN NEW;
  END IF;

  -- Only active cargo contributes to load.
  IF NEW.status NOT IN ('pending', 'in_transit') THEN
    RETURN NEW;
  END IF;

  SELECT t.route, v.plate_number, v.capacity
  INTO trip_route, vehicle_plate, vehicle_capacity
  FROM trips t
  LEFT JOIN vehicles v ON v.id = t.vehicle_id
  WHERE t.id = NEW.trip_id
    AND t.org_id = NEW.org_id;

  IF trip_route IS NULL THEN
    RAISE EXCEPTION 'Trip not found for shipment capacity validation';
  END IF;

  -- If the trip has no vehicle yet, defer capacity enforcement.
  IF vehicle_capacity IS NULL THEN
    RETURN NEW;
  END IF;

  SELECT COALESCE(SUM(s.weight), 0)
  INTO existing_load
  FROM shipments s
  WHERE s.org_id = NEW.org_id
    AND s.trip_id = NEW.trip_id
    AND s.status IN ('pending', 'in_transit')
    AND s.id <> COALESCE(NEW.id, '00000000-0000-0000-0000-000000000000'::uuid);

  projected_load := existing_load + NEW.weight;

  IF projected_load > vehicle_capacity THEN
    RAISE EXCEPTION
      'Shipment exceeds vehicle capacity: trip "%" (%s), vehicle %s allows %s kg, projected load is %s kg',
      trip_route,
      NEW.trip_id,
      COALESCE(vehicle_plate, 'unknown'),
      ROUND(vehicle_capacity::numeric, 2),
      ROUND(projected_load::numeric, 2);
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION enforce_trip_vehicle_capacity_on_vehicle_assignment()
RETURNS TRIGGER AS $$
DECLARE
  vehicle_capacity NUMERIC;
  vehicle_plate TEXT;
  existing_load NUMERIC;
BEGIN
  IF NEW.vehicle_id IS NULL THEN
    RETURN NEW;
  END IF;

  SELECT plate_number, capacity
  INTO vehicle_plate, vehicle_capacity
  FROM vehicles
  WHERE id = NEW.vehicle_id
    AND org_id = NEW.org_id;

  IF vehicle_capacity IS NULL THEN
    RAISE EXCEPTION 'Vehicle not found for trip capacity validation';
  END IF;

  SELECT COALESCE(SUM(weight), 0)
  INTO existing_load
  FROM shipments
  WHERE org_id = NEW.org_id
    AND trip_id = NEW.id
    AND status IN ('pending', 'in_transit');

  IF existing_load > vehicle_capacity THEN
    RAISE EXCEPTION
      'Trip load already exceeds selected vehicle capacity: vehicle %s allows %s kg, current trip load is %s kg',
      vehicle_plate,
      ROUND(vehicle_capacity::numeric, 2),
      ROUND(existing_load::numeric, 2);
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS enforce_trip_vehicle_capacity_on_shipments_trigger ON shipments;
CREATE TRIGGER enforce_trip_vehicle_capacity_on_shipments_trigger
BEFORE INSERT OR UPDATE OF trip_id, weight, status ON shipments
FOR EACH ROW
EXECUTE FUNCTION enforce_trip_vehicle_capacity_on_shipments();

DROP TRIGGER IF EXISTS enforce_trip_vehicle_capacity_on_vehicle_assignment_trigger ON trips;
CREATE TRIGGER enforce_trip_vehicle_capacity_on_vehicle_assignment_trigger
BEFORE INSERT OR UPDATE OF vehicle_id ON trips
FOR EACH ROW
EXECUTE FUNCTION enforce_trip_vehicle_capacity_on_vehicle_assignment();
