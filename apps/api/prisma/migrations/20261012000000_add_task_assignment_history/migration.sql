CREATE TABLE "task_assignment_history" (
  "id" TEXT NOT NULL,
  "task_id" TEXT NOT NULL,
  "previous_assignee_id" TEXT,
  "new_assignee_id" TEXT NOT NULL,
  "changed_by" TEXT NOT NULL,
  "reason" TEXT,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "task_assignment_history_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "task_assignment_history_task_id_fkey"
    FOREIGN KEY ("task_id") REFERENCES "tasks"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "task_assignment_history_previous_assignee_id_fkey"
    FOREIGN KEY ("previous_assignee_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT "task_assignment_history_new_assignee_id_fkey"
    FOREIGN KEY ("new_assignee_id") REFERENCES "users"("id") ON UPDATE CASCADE,
  CONSTRAINT "task_assignment_history_changed_by_fkey"
    FOREIGN KEY ("changed_by") REFERENCES "users"("id") ON UPDATE CASCADE
);

CREATE INDEX "task_assignment_history_task_id_idx"
  ON "task_assignment_history"("task_id");
CREATE INDEX "task_assignment_history_previous_assignee_id_idx"
  ON "task_assignment_history"("previous_assignee_id");
CREATE INDEX "task_assignment_history_new_assignee_id_idx"
  ON "task_assignment_history"("new_assignee_id");
CREATE INDEX "task_assignment_history_changed_by_idx"
  ON "task_assignment_history"("changed_by");
CREATE INDEX "task_assignment_history_created_at_idx"
  ON "task_assignment_history"("created_at");
