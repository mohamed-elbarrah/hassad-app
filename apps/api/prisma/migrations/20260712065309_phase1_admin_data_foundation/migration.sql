/*
  Warnings:

  - Made the column `task_id` on table `campaigns` required. This step will fail if there are existing NULL values in that column.

*/
-- CreateEnum
CREATE TYPE "system_event_types" AS ENUM ('WEBHOOK_FAILURE', 'GATEWAY_FAILURE', 'NOTIFICATION_FAILURE', 'INTEGRATION_SYNC_FAILURE', 'PAYMENT_FAILURE', 'AUTH_FAILURE');

-- CreateEnum
CREATE TYPE "system_event_statuses" AS ENUM ('OPEN', 'ACKNOWLEDGED', 'RESOLVED', 'DISMISSED');

-- CreateEnum
CREATE TYPE "report_periods" AS ENUM ('DAILY', 'WEEKLY', 'MONTHLY', 'CUSTOM');

-- AlterTable
ALTER TABLE "bank_accounts" ADD COLUMN     "account_number" TEXT,
ADD COLUMN     "balance" DECIMAL(65,30) DEFAULT 0,
ADD COLUMN     "is_default" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "campaigns" ALTER COLUMN "task_id" SET NOT NULL;

-- AlterTable
ALTER TABLE "clients" ADD COLUMN     "suspend_reason" TEXT,
ADD COLUMN     "suspended_at" TIMESTAMP(3),
ADD COLUMN     "suspended_by_id" TEXT,
ADD COLUMN     "suspended_until" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "suspend_reason" TEXT,
ADD COLUMN     "suspended_at" TIMESTAMP(3),
ADD COLUMN     "suspended_by_id" TEXT,
ADD COLUMN     "suspended_until" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "admin_action_logs" (
    "id" TEXT NOT NULL,
    "actor_id" TEXT NOT NULL,
    "target_type" TEXT NOT NULL,
    "target_id" TEXT NOT NULL,
    "action_type" TEXT NOT NULL,
    "reason" TEXT,
    "before_state" JSONB,
    "after_state" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "admin_action_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "system_event_logs" (
    "id" TEXT NOT NULL,
    "event_type" "system_event_types" NOT NULL,
    "source" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "metadata" JSONB,
    "status" "system_event_statuses" NOT NULL DEFAULT 'OPEN',
    "resolved_at" TIMESTAMP(3),
    "resolved_by" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "system_event_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "report_snapshots" (
    "id" TEXT NOT NULL,
    "report_type" TEXT NOT NULL,
    "period" "report_periods" NOT NULL,
    "period_start" TIMESTAMP(3) NOT NULL,
    "period_end" TIMESTAMP(3) NOT NULL,
    "data" JSONB NOT NULL,
    "generated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "report_snapshots_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "admin_action_logs_actor_id_idx" ON "admin_action_logs"("actor_id");

-- CreateIndex
CREATE INDEX "admin_action_logs_target_type_target_id_idx" ON "admin_action_logs"("target_type", "target_id");

-- CreateIndex
CREATE INDEX "admin_action_logs_action_type_idx" ON "admin_action_logs"("action_type");

-- CreateIndex
CREATE INDEX "admin_action_logs_created_at_idx" ON "admin_action_logs"("created_at");

-- CreateIndex
CREATE INDEX "system_event_logs_event_type_idx" ON "system_event_logs"("event_type");

-- CreateIndex
CREATE INDEX "system_event_logs_status_idx" ON "system_event_logs"("status");

-- CreateIndex
CREATE INDEX "system_event_logs_created_at_idx" ON "system_event_logs"("created_at");

-- CreateIndex
CREATE INDEX "report_snapshots_report_type_period_period_start_idx" ON "report_snapshots"("report_type", "period", "period_start");

-- CreateIndex
CREATE INDEX "report_snapshots_generated_at_idx" ON "report_snapshots"("generated_at");

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_suspended_by_id_fkey" FOREIGN KEY ("suspended_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "clients" ADD CONSTRAINT "clients_suspended_by_id_fkey" FOREIGN KEY ("suspended_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "admin_action_logs" ADD CONSTRAINT "admin_action_logs_actor_id_fkey" FOREIGN KEY ("actor_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "system_event_logs" ADD CONSTRAINT "system_event_logs_resolved_by_fkey" FOREIGN KEY ("resolved_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
