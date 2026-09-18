-- Consolidate the legacy "Manual Bank Transfer" gateway into the canonical
-- bank_transfer gateway without losing payment gateway references.
-- The legacy bankAccountId config is informational only; active bank accounts
-- are stored in bank_accounts and are not encoded in the gateway identity.
DO $$
DECLARE
  legacy_id TEXT;
  canonical_id TEXT;
BEGIN
  SELECT id
    INTO legacy_id
  FROM payment_gateways
  WHERE name = 'Manual Bank Transfer';

  SELECT id
    INTO canonical_id
  FROM payment_gateways
  WHERE name = 'bank_transfer';

  IF legacy_id IS NOT NULL AND canonical_id IS NULL THEN
    UPDATE payment_gateways
    SET name = 'bank_transfer',
        type = 'MANUAL',
        updated_at = NOW()
    WHERE id = legacy_id;
  ELSIF legacy_id IS NOT NULL AND canonical_id IS NOT NULL AND legacy_id <> canonical_id THEN
    UPDATE payments
    SET gateway_id = canonical_id
    WHERE gateway_id = legacy_id;

    UPDATE payment_gateways AS canonical
    SET type = 'MANUAL',
        is_active = canonical.is_active OR legacy.is_active,
        config_json = CASE
          WHEN canonical.config_json IS NULL THEN legacy.config_json
          WHEN legacy.config_json IS NULL THEN canonical.config_json
          WHEN jsonb_typeof(canonical.config_json) = 'object'
            AND jsonb_typeof(legacy.config_json) = 'object'
            THEN legacy.config_json || canonical.config_json
          ELSE canonical.config_json
        END,
        updated_at = NOW()
    FROM payment_gateways AS legacy
    WHERE canonical.id = canonical_id
      AND legacy.id = legacy_id;

    DELETE FROM payment_gateways
    WHERE id = legacy_id;
  END IF;
END $$;
