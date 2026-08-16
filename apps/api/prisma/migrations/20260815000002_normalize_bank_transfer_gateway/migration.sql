-- Normalize the legacy display name to the single supported bank-transfer option.
DO $$
DECLARE
  legacy_id TEXT;
  canonical_id TEXT;
BEGIN
  SELECT id INTO legacy_id
  FROM payment_gateways
  WHERE lower(name) = 'manual bank transfer'
  LIMIT 1;

  SELECT id INTO canonical_id
  FROM payment_gateways
  WHERE name = 'bank_transfer'
  LIMIT 1;

  IF legacy_id IS NOT NULL AND canonical_id IS NOT NULL AND legacy_id <> canonical_id THEN
    UPDATE payments SET gateway_id = canonical_id WHERE gateway_id = legacy_id;
    DELETE FROM payment_gateways WHERE id = legacy_id;
  ELSIF legacy_id IS NOT NULL AND canonical_id IS NULL THEN
    UPDATE payment_gateways SET name = 'bank_transfer', type = 'MANUAL' WHERE id = legacy_id;
  END IF;
END $$;
