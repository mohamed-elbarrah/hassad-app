-- Keep webhook deliveries idempotent per provider event.
ALTER TABLE "webhook_logs"
  ADD COLUMN "provider_event_id" TEXT;

CREATE UNIQUE INDEX "webhook_logs_provider_provider_event_id_key"
  ON "webhook_logs"("provider", "provider_event_id");
