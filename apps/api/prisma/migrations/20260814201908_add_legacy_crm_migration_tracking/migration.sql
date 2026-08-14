-- CreateEnum
CREATE TYPE "LegacyLeadMigrationStatus" AS ENUM ('PENDING', 'MIGRATED', 'REVIEW_REQUIRED', 'FAILED', 'VERIFIED');

-- CreateTable
CREATE TABLE "legacy_lead_migrations" (
    "id" TEXT NOT NULL,
    "lead_id" TEXT NOT NULL,
    "request_id" TEXT,
    "client_id" TEXT,
    "status" "LegacyLeadMigrationStatus" NOT NULL DEFAULT 'PENDING',
    "checksum" TEXT,
    "error" TEXT,
    "migrated_at" TIMESTAMP(3),
    "verified_at" TIMESTAMP(3),
    "counts" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "legacy_lead_migrations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "legacy_contract_migration_reviews" (
    "id" TEXT NOT NULL,
    "contract_id" TEXT NOT NULL,
    "client_id" TEXT,
    "reason" TEXT NOT NULL,
    "candidate_request_ids" JSONB,
    "resolved_request_id" TEXT,
    "resolved_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "legacy_contract_migration_reviews_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "legacy_lead_migrations_lead_id_key" ON "legacy_lead_migrations"("lead_id");

-- CreateIndex
CREATE UNIQUE INDEX "legacy_lead_migrations_request_id_key" ON "legacy_lead_migrations"("request_id");

-- CreateIndex
CREATE INDEX "legacy_lead_migrations_status_idx" ON "legacy_lead_migrations"("status");

-- CreateIndex
CREATE INDEX "legacy_lead_migrations_client_id_idx" ON "legacy_lead_migrations"("client_id");

-- CreateIndex
CREATE UNIQUE INDEX "legacy_contract_migration_reviews_contract_id_key" ON "legacy_contract_migration_reviews"("contract_id");

-- CreateIndex
CREATE INDEX "legacy_contract_migration_reviews_client_id_idx" ON "legacy_contract_migration_reviews"("client_id");

-- CreateIndex
CREATE INDEX "legacy_contract_migration_reviews_resolved_request_id_idx" ON "legacy_contract_migration_reviews"("resolved_request_id");
