/*
  Warnings:

  - The `sync_status` column on the `ad_platform_connections` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- CreateEnum
CREATE TYPE "pay_types" AS ENUM ('FIXED', 'HOURLY', 'COMMISSION', 'HYBRID');

-- CreateEnum
CREATE TYPE "SyncStatus" AS ENUM ('PENDING', 'CONNECTED', 'SYNCING', 'ERROR', 'DISCONNECTED');

-- AlterTable
ALTER TABLE "ad_platform_connections" DROP COLUMN "sync_status",
ADD COLUMN     "sync_status" "SyncStatus" NOT NULL DEFAULT 'PENDING';

-- AlterTable
ALTER TABLE "campaign_kpi_snapshots" ADD COLUMN     "external_id" TEXT,
ADD COLUMN     "period_end" TIMESTAMP(3),
ADD COLUMN     "period_start" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "campaigns" ADD COLUMN     "is_archived" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "contracts" ADD COLUMN     "sales_person_id" TEXT;

-- AlterTable
ALTER TABLE "employees" ADD COLUMN     "commission_rate" DOUBLE PRECISION,
ADD COLUMN     "currency" TEXT NOT NULL DEFAULT 'SAR',
ADD COLUMN     "hourly_rate" DOUBLE PRECISION,
ADD COLUMN     "monthly_target" DOUBLE PRECISION,
ADD COLUMN     "pay_type" "pay_types" NOT NULL DEFAULT 'FIXED';

-- AlterTable
ALTER TABLE "ledger" ADD COLUMN     "metadata" JSONB;

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "is_payroll_eligible" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "campaign_status_history" (
    "id" TEXT NOT NULL,
    "campaign_id" TEXT NOT NULL,
    "from_status" "CampaignStatus" NOT NULL,
    "to_status" "CampaignStatus" NOT NULL,
    "changed_by" TEXT,
    "reason" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "campaign_status_history_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "system_health_checks" (
    "id" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "overall_score" INTEGER NOT NULL,
    "components" JSONB NOT NULL,
    "memory_used" DOUBLE PRECISION,
    "memory_total" DOUBLE PRECISION,
    "uptime" DOUBLE PRECISION NOT NULL,
    "cpu_usage" DOUBLE PRECISION,
    "total_response_time" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "system_health_checks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "system_errors" (
    "id" TEXT NOT NULL,
    "level" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "stack_trace" TEXT,
    "context" JSONB,
    "service" TEXT NOT NULL,
    "endpoint" TEXT,
    "resolved" BOOLEAN NOT NULL DEFAULT false,
    "resolved_at" TIMESTAMP(3),
    "resolution_note" TEXT,
    "resolved_by" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "system_errors_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "external_service_health" (
    "id" TEXT NOT NULL,
    "service_name" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "response_time" INTEGER NOT NULL,
    "last_checked_at" TIMESTAMP(3) NOT NULL,
    "last_error" TEXT,
    "last_error_at" TIMESTAMP(3),
    "consecutive_failures" INTEGER NOT NULL DEFAULT 0,
    "timeout_threshold" INTEGER NOT NULL DEFAULT 5000,
    "degradation_threshold" INTEGER NOT NULL DEFAULT 2000,

    CONSTRAINT "external_service_health_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "campaign_status_history_campaign_id_idx" ON "campaign_status_history"("campaign_id");

-- CreateIndex
CREATE INDEX "system_health_checks_created_at_idx" ON "system_health_checks"("created_at");

-- CreateIndex
CREATE INDEX "system_health_checks_status_idx" ON "system_health_checks"("status");

-- CreateIndex
CREATE INDEX "system_errors_created_at_idx" ON "system_errors"("created_at");

-- CreateIndex
CREATE INDEX "system_errors_level_idx" ON "system_errors"("level");

-- CreateIndex
CREATE INDEX "system_errors_category_idx" ON "system_errors"("category");

-- CreateIndex
CREATE INDEX "system_errors_resolved_idx" ON "system_errors"("resolved");

-- CreateIndex
CREATE INDEX "system_errors_service_idx" ON "system_errors"("service");

-- CreateIndex
CREATE UNIQUE INDEX "external_service_health_service_name_key" ON "external_service_health"("service_name");

-- CreateIndex
CREATE INDEX "contracts_sales_person_id_idx" ON "contracts"("sales_person_id");

-- CreateIndex
CREATE INDEX "ledger_action_idx" ON "ledger"("action");

-- AddForeignKey
ALTER TABLE "contracts" ADD CONSTRAINT "contracts_sales_person_id_fkey" FOREIGN KEY ("sales_person_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "campaign_status_history" ADD CONSTRAINT "campaign_status_history_campaign_id_fkey" FOREIGN KEY ("campaign_id") REFERENCES "campaigns"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "campaign_status_history" ADD CONSTRAINT "campaign_status_history_changed_by_fkey" FOREIGN KEY ("changed_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
