-- CreateEnum
CREATE TYPE "MeetingStatus" AS ENUM ('SCHEDULED', 'DONE', 'CANCELLED', 'RESCHEDULED');

-- CreateTable
CREATE TABLE "project_meetings" (
    "id" TEXT NOT NULL,
    "project_id" TEXT NOT NULL,
    "period_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "scheduled_at" TIMESTAMP(3) NOT NULL,
    "duration_min" INTEGER,
    "location" TEXT,
    "meeting_link" TEXT,
    "status" "MeetingStatus" NOT NULL DEFAULT 'SCHEDULED',
    "notes" TEXT,
    "created_by" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "project_meetings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "project_meetings_project_id_idx" ON "project_meetings"("project_id");

-- CreateIndex
CREATE INDEX "project_meetings_period_id_idx" ON "project_meetings"("period_id");

-- CreateIndex
CREATE INDEX "project_meetings_status_idx" ON "project_meetings"("status");

-- CreateIndex
CREATE INDEX "project_meetings_scheduled_at_idx" ON "project_meetings"("scheduled_at");

-- AddForeignKey
ALTER TABLE "project_meetings" ADD CONSTRAINT "project_meetings_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "project_meetings" ADD CONSTRAINT "project_meetings_period_id_fkey" FOREIGN KEY ("period_id") REFERENCES "project_periods"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "project_meetings" ADD CONSTRAINT "project_meetings_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
