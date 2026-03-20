-- Allow client/receiver contact fields to be nullable.
-- Keeps only "name" mandatory at the database level.

ALTER TABLE clients
  ALTER COLUMN phone DROP NOT NULL;

ALTER TABLE receivers
  ALTER COLUMN phone DROP NOT NULL,
  ALTER COLUMN address DROP NOT NULL,
  ALTER COLUMN city DROP NOT NULL,
  ALTER COLUMN country DROP NOT NULL;

-- Normalize empty strings to NULL for optional fields.
UPDATE clients
SET
  phone = NULLIF(BTRIM(phone), ''),
  whatsapp = NULLIF(BTRIM(whatsapp), ''),
  email = NULLIF(BTRIM(email), ''),
  address = NULLIF(BTRIM(address), ''),
  city = NULLIF(BTRIM(city), ''),
  country = NULLIF(BTRIM(country), ''),
  notes = NULLIF(BTRIM(notes), '');

UPDATE receivers
SET
  phone = NULLIF(BTRIM(phone), ''),
  address = NULLIF(BTRIM(address), ''),
  city = NULLIF(BTRIM(city), ''),
  country = NULLIF(BTRIM(country), '');
