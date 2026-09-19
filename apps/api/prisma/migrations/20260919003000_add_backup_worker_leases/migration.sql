ALTER TABLE "backup_operations"
  ADD COLUMN "lease_owner" TEXT,
  ADD COLUMN "lease_expires_at" TIMESTAMP(3);

CREATE INDEX "backup_operations_lease_expires_at_idx"
  ON "backup_operations"("lease_expires_at");
