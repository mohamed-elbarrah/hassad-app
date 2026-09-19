ALTER TABLE "backup_operations"
  ADD COLUMN "attempt_count" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN "max_attempts" INTEGER NOT NULL DEFAULT 3,
  ADD COLUMN "next_attempt_at" TIMESTAMP(3);

CREATE INDEX "backup_operations_next_attempt_at_idx"
  ON "backup_operations"("next_attempt_at");
