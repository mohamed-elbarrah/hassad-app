CREATE TYPE "backup_scopes" AS ENUM ('DATABASE_ONLY', 'FULL_SYSTEM');
CREATE TYPE "backup_triggers" AS ENUM ('SCHEDULED', 'MANUAL');
CREATE TYPE "backup_statuses" AS ENUM ('QUEUED', 'RUNNING', 'COMPLETED', 'FAILED', 'EXPIRED');
CREATE TYPE "backup_operation_types" AS ENUM ('CREATE', 'RESTORE', 'DELETE');
CREATE TYPE "backup_operation_statuses" AS ENUM ('QUEUED', 'RUNNING', 'COMPLETED', 'FAILED');

CREATE TABLE "backups" (
  "id" TEXT NOT NULL,
  "scope" "backup_scopes" NOT NULL,
  "trigger" "backup_triggers" NOT NULL,
  "status" "backup_statuses" NOT NULL DEFAULT 'QUEUED',
  "database_key" TEXT,
  "files_prefix" TEXT,
  "manifest_key" TEXT,
  "checksum" TEXT,
  "size_bytes" BIGINT,
  "file_count" INTEGER NOT NULL DEFAULT 0,
  "app_version" TEXT,
  "migration_version" TEXT,
  "created_by_id" TEXT,
  "error_code" TEXT,
  "error_details" JSONB,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "started_at" TIMESTAMP(3),
  "completed_at" TIMESTAMP(3),
  "expires_at" TIMESTAMP(3),
  CONSTRAINT "backups_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "backup_operations" (
  "id" TEXT NOT NULL,
  "backup_id" TEXT,
  "type" "backup_operation_types" NOT NULL,
  "status" "backup_operation_statuses" NOT NULL DEFAULT 'QUEUED',
  "requested_by_id" TEXT,
  "error_code" TEXT,
  "details" JSONB,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "started_at" TIMESTAMP(3),
  "completed_at" TIMESTAMP(3),
  CONSTRAINT "backup_operations_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "backups_status_created_at_idx" ON "backups"("status", "created_at");
CREATE INDEX "backups_expires_at_idx" ON "backups"("expires_at");
CREATE INDEX "backup_operations_status_created_at_idx" ON "backup_operations"("status", "created_at");
CREATE INDEX "backup_operations_backup_id_idx" ON "backup_operations"("backup_id");

ALTER TABLE "backups"
  ADD CONSTRAINT "backups_created_by_id_fkey"
  FOREIGN KEY ("created_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "backup_operations"
  ADD CONSTRAINT "backup_operations_backup_id_fkey"
  FOREIGN KEY ("backup_id") REFERENCES "backups"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "backup_operations"
  ADD CONSTRAINT "backup_operations_requested_by_id_fkey"
  FOREIGN KEY ("requested_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

INSERT INTO "permissions" ("id", "name")
VALUES
  (gen_random_uuid(), 'admin.backups.read'),
  (gen_random_uuid(), 'admin.backups.manage'),
  (gen_random_uuid(), 'admin.backups.restore')
ON CONFLICT ("name") DO NOTHING;

INSERT INTO "role_permissions" ("role_id", "permission_id")
SELECT r."id", p."id"
FROM "roles" r
CROSS JOIN "permissions" p
WHERE r."name" = 'ADMIN'
  AND p."name" IN ('admin.backups.read', 'admin.backups.manage', 'admin.backups.restore')
ON CONFLICT DO NOTHING;
