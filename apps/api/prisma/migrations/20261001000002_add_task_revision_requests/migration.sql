CREATE TYPE "TaskRevisionStatus" AS ENUM ('OPEN', 'RESOLVED');

CREATE TABLE "task_revision_requests" (
  "id" TEXT NOT NULL,
  "task_id" TEXT NOT NULL,
  "client_id" TEXT NOT NULL,
  "request_description" TEXT NOT NULL,
  "status" "TaskRevisionStatus" NOT NULL DEFAULT 'OPEN',
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "resolved_at" TIMESTAMP(3),
  CONSTRAINT "task_revision_requests_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "task_revision_requests_task_id_fkey"
    FOREIGN KEY ("task_id") REFERENCES "tasks"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "task_revision_requests_client_id_fkey"
    FOREIGN KEY ("client_id") REFERENCES "clients"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX "task_revision_requests_task_id_idx" ON "task_revision_requests"("task_id");
CREATE INDEX "task_revision_requests_client_id_idx" ON "task_revision_requests"("client_id");
CREATE INDEX "task_revision_requests_status_idx" ON "task_revision_requests"("status");
