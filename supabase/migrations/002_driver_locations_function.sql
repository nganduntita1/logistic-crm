-- Function to get the latest location for each active driver
-- This is used by the map visualization to show current driver positions

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
    p.full_name as driver_name,
    dl.latitude,
    dl.longitude,
    dl.timestamp
  FROM driver_locations dl
  JOIN drivers d ON d.id = dl.driver_id
  JOIN profiles p ON p.id = d.user_id
  WHERE d.status = 'active'
  ORDER BY dl.driver_id, dl.timestamp DESC;
END;
$$ LANGUAGE plpgsql;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION get_latest_driver_locations() TO authenticated;

-- Example usage:
-- SELECT * FROM get_latest_driver_locations();
