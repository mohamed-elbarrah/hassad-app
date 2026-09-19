-- Register Tap as an online payment gateway.
-- Credentials are configured and encrypted through the admin payment-gateway settings.
INSERT INTO payment_gateways (id, name, type, config_json, is_active, created_at, updated_at)
VALUES (gen_random_uuid(), 'tap', 'ONLINE', '{}', false, NOW(), NOW())
ON CONFLICT (name) DO NOTHING;
