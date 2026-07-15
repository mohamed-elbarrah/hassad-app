-- Seed default payment gateways
-- Run as a data migration (no schema changes)
-- Inserts stripe (inactive, config set later) and bank_transfer (active by default)

INSERT INTO payment_gateways (id, name, type, config_json, is_active, created_at, updated_at)
VALUES
  (gen_random_uuid(), 'stripe', 'ONLINE', '{}', false, NOW(), NOW()),
  (gen_random_uuid(), 'bank_transfer', 'MANUAL', '{}', true, NOW(), NOW())
ON CONFLICT (name) DO NOTHING;
