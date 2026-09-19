-- Prevent duplicate provider payment identities within a gateway.
-- NULL provider IDs are excluded because manual/local attempts may not have one.
CREATE UNIQUE INDEX "payments_gateway_provider_payment_key"
  ON "payments" ("gateway_id", "provider_payment_id");
