-- CreateEnum
CREATE TYPE "dispute_statuses" AS ENUM ('PENDING_APPROVAL', 'REJECTED', 'APPROVED', 'IN_PROGRESS', 'PENDING_CLIENT', 'ESCALATED', 'RESOLVED', 'CLOSED');

-- CreateEnum
CREATE TYPE "dispute_categories" AS ENUM ('DELAY', 'QUALITY', 'COMMUNICATION', 'BUDGET', 'SCOPE', 'ATTITUDE', 'OTHER');

-- CreateEnum
CREATE TYPE "dispute_priorities" AS ENUM ('LOW', 'NORMAL', 'HIGH', 'URGENT');

-- CreateTable
CREATE TABLE "dispute_tickets" (
    "id" TEXT NOT NULL,
    "ticketNumber" INTEGER NOT NULL,
    "client_id" TEXT NOT NULL,
    "pm_id" TEXT NOT NULL,
    "project_id" TEXT NOT NULL,
    "reviewed_by" TEXT,
    "resolved_by" TEXT,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "category" "dispute_categories" NOT NULL,
    "status" "dispute_statuses" NOT NULL DEFAULT 'PENDING_APPROVAL',
    "priority" "dispute_priorities" NOT NULL DEFAULT 'NORMAL',
    "opened_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "approved_at" TIMESTAMP(3),
    "deadline_at" TIMESTAMP(3),
    "client_notified_at" TIMESTAMP(3),
    "client_responded_at" TIMESTAMP(3),
    "client_confirmed_resolved" BOOLEAN,
    "escalated_at" TIMESTAMP(3),
    "resolved_at" TIMESTAMP(3),
    "closed_at" TIMESTAMP(3),
    "resolution" TEXT,
    "pm_changed" BOOLEAN NOT NULL DEFAULT false,
    "new_pm_id" TEXT,
    "rejection_reason" TEXT,

    CONSTRAINT "dispute_tickets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "dispute_messages" (
    "id" TEXT NOT NULL,
    "ticket_id" TEXT NOT NULL,
    "author_id" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "is_internal" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "dispute_messages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "dispute_attachments" (
    "id" TEXT NOT NULL,
    "ticket_id" TEXT NOT NULL,
    "message_id" TEXT,
    "uploaded_by" TEXT NOT NULL,
    "file_name" TEXT NOT NULL,
    "file_path" TEXT NOT NULL,
    "file_size" INTEGER NOT NULL,
    "mime_type" TEXT NOT NULL,
    "uploaded_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "dispute_attachments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "dispute_history" (
    "id" TEXT NOT NULL,
    "ticket_id" TEXT NOT NULL,
    "from_status" "dispute_statuses",
    "to_status" "dispute_statuses" NOT NULL,
    "changed_by" TEXT NOT NULL,
    "changed_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "note" TEXT,

    CONSTRAINT "dispute_history_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pm_dispute_stats" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "total_disputes" INTEGER NOT NULL DEFAULT 0,
    "resolved_disputes" INTEGER NOT NULL DEFAULT 0,
    "escalated_disputes" INTEGER NOT NULL DEFAULT 0,
    "pm_changed_count" INTEGER NOT NULL DEFAULT 0,
    "avg_resolution_days" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "last_updated" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "pm_dispute_stats_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "dispute_tickets_ticketNumber_key" ON "dispute_tickets"("ticketNumber");

-- CreateIndex
CREATE INDEX "dispute_tickets_client_id_idx" ON "dispute_tickets"("client_id");

-- CreateIndex
CREATE INDEX "dispute_tickets_pm_id_idx" ON "dispute_tickets"("pm_id");

-- CreateIndex
CREATE INDEX "dispute_tickets_project_id_idx" ON "dispute_tickets"("project_id");

-- CreateIndex
CREATE INDEX "dispute_tickets_status_idx" ON "dispute_tickets"("status");

-- CreateIndex
CREATE INDEX "dispute_tickets_opened_at_idx" ON "dispute_tickets"("opened_at");

-- CreateIndex
CREATE INDEX "dispute_messages_ticket_id_idx" ON "dispute_messages"("ticket_id");

-- CreateIndex
CREATE INDEX "dispute_messages_created_at_idx" ON "dispute_messages"("created_at");

-- CreateIndex
CREATE INDEX "dispute_attachments_ticket_id_idx" ON "dispute_attachments"("ticket_id");

-- CreateIndex
CREATE INDEX "dispute_history_ticket_id_idx" ON "dispute_history"("ticket_id");

-- CreateIndex
CREATE INDEX "dispute_history_changed_at_idx" ON "dispute_history"("changed_at");

-- CreateIndex
CREATE UNIQUE INDEX "pm_dispute_stats_user_id_key" ON "pm_dispute_stats"("user_id");

-- AddForeignKey
ALTER TABLE "dispute_tickets" ADD CONSTRAINT "dispute_tickets_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "clients"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dispute_tickets" ADD CONSTRAINT "dispute_tickets_pm_id_fkey" FOREIGN KEY ("pm_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dispute_tickets" ADD CONSTRAINT "dispute_tickets_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dispute_tickets" ADD CONSTRAINT "dispute_tickets_reviewed_by_fkey" FOREIGN KEY ("reviewed_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dispute_tickets" ADD CONSTRAINT "dispute_tickets_resolved_by_fkey" FOREIGN KEY ("resolved_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dispute_tickets" ADD CONSTRAINT "dispute_tickets_new_pm_id_fkey" FOREIGN KEY ("new_pm_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dispute_messages" ADD CONSTRAINT "dispute_messages_author_id_fkey" FOREIGN KEY ("author_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dispute_messages" ADD CONSTRAINT "dispute_messages_ticket_id_fkey" FOREIGN KEY ("ticket_id") REFERENCES "dispute_tickets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dispute_attachments" ADD CONSTRAINT "dispute_attachments_ticket_id_fkey" FOREIGN KEY ("ticket_id") REFERENCES "dispute_tickets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dispute_attachments" ADD CONSTRAINT "dispute_attachments_message_id_fkey" FOREIGN KEY ("message_id") REFERENCES "dispute_messages"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dispute_attachments" ADD CONSTRAINT "dispute_attachments_uploaded_by_fkey" FOREIGN KEY ("uploaded_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dispute_history" ADD CONSTRAINT "dispute_history_ticket_id_fkey" FOREIGN KEY ("ticket_id") REFERENCES "dispute_tickets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dispute_history" ADD CONSTRAINT "dispute_history_changed_by_fkey" FOREIGN KEY ("changed_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pm_dispute_stats" ADD CONSTRAINT "pm_dispute_stats_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
