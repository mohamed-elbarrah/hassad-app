-- Preserve a useful suspension timestamp for legacy STOPPED rows converted to SUSPENDED.
UPDATE "clients"
SET "suspended_at" = COALESCE("suspended_at", "updated_at")
WHERE "status" = 'SUSPENDED'
  AND "suspended_at" IS NULL;
