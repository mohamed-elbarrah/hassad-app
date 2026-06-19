-- CreateEnum
CREATE TYPE "ProjectPeriodStatus" AS ENUM ('UPCOMING', 'ACTIVE', 'CLOSED', 'SUSPENDED');

-- AlterTable
ALTER TABLE "campaign_kpi_snapshots" ADD COLUMN     "period_id" TEXT;

-- AlterTable
ALTER TABLE "campaigns" ADD COLUMN     "period_id" TEXT;

-- AlterTable
ALTER TABLE "deliverables" ADD COLUMN     "period_id" TEXT;

-- AlterTable
ALTER TABLE "project_files" ADD COLUMN     "period_id" TEXT;

-- AlterTable
ALTER TABLE "tasks" ADD COLUMN     "period_id" TEXT;

-- CreateTable
CREATE TABLE "project_periods" (
    "id" TEXT NOT NULL,
    "project_id" TEXT NOT NULL,
    "period_number" INTEGER NOT NULL,
    "start_date" TIMESTAMP(3) NOT NULL,
    "end_date" TIMESTAMP(3) NOT NULL,
    "status" "ProjectPeriodStatus" NOT NULL,
    "summary" TEXT,
    "report_file_path" TEXT,
    "completion_percentage" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "invoice_id" TEXT,
    "closed_at" TIMESTAMP(3),
    "suspended_at" TIMESTAMP(3),
    "resumed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "project_periods_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "project_period_history" (
    "id" TEXT NOT NULL,
    "period_id" TEXT NOT NULL,
    "from_status" "ProjectPeriodStatus" NOT NULL,
    "to_status" "ProjectPeriodStatus" NOT NULL,
    "changed_by" TEXT NOT NULL,
    "reason" TEXT,
    "changed_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "project_period_history_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "project_periods_invoice_id_key" ON "project_periods"("invoice_id");

-- CreateIndex
CREATE INDEX "project_periods_project_id_idx" ON "project_periods"("project_id");

-- CreateIndex
CREATE INDEX "project_periods_status_idx" ON "project_periods"("status");

-- CreateIndex
CREATE INDEX "project_periods_period_number_idx" ON "project_periods"("period_number");

-- CreateIndex
CREATE INDEX "project_period_history_period_id_idx" ON "project_period_history"("period_id");

-- CreateIndex
CREATE INDEX "project_period_history_to_status_idx" ON "project_period_history"("to_status");

-- CreateIndex
CREATE INDEX "campaign_kpi_snapshots_period_id_idx" ON "campaign_kpi_snapshots"("period_id");

-- CreateIndex
CREATE INDEX "campaigns_period_id_idx" ON "campaigns"("period_id");

-- CreateIndex
CREATE INDEX "deliverables_period_id_idx" ON "deliverables"("period_id");

-- CreateIndex
CREATE INDEX "project_files_period_id_idx" ON "project_files"("period_id");

-- CreateIndex
CREATE INDEX "tasks_period_id_idx" ON "tasks"("period_id");

-- AddForeignKey
ALTER TABLE "project_periods" ADD CONSTRAINT "project_periods_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "project_periods" ADD CONSTRAINT "project_periods_invoice_id_fkey" FOREIGN KEY ("invoice_id") REFERENCES "invoices"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "project_period_history" ADD CONSTRAINT "project_period_history_period_id_fkey" FOREIGN KEY ("period_id") REFERENCES "project_periods"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "project_period_history" ADD CONSTRAINT "project_period_history_changed_by_fkey" FOREIGN KEY ("changed_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_period_id_fkey" FOREIGN KEY ("period_id") REFERENCES "project_periods"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "campaigns" ADD CONSTRAINT "campaigns_period_id_fkey" FOREIGN KEY ("period_id") REFERENCES "project_periods"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "campaign_kpi_snapshots" ADD CONSTRAINT "campaign_kpi_snapshots_period_id_fkey" FOREIGN KEY ("period_id") REFERENCES "project_periods"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "deliverables" ADD CONSTRAINT "deliverables_period_id_fkey" FOREIGN KEY ("period_id") REFERENCES "project_periods"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "project_files" ADD CONSTRAINT "project_files_period_id_fkey" FOREIGN KEY ("period_id") REFERENCES "project_periods"("id") ON DELETE SET NULL ON UPDATE CASCADE;
