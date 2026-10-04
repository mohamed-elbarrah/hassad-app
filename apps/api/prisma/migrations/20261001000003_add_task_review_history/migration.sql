CREATE TABLE "task_review_history" (
  "id" TEXT NOT NULL,
  "task_id" TEXT NOT NULL,
  "from_stage" "TaskReviewStage" NOT NULL,
  "to_stage" "TaskReviewStage" NOT NULL,
  "actor_id" TEXT NOT NULL,
  "actor_type" TEXT NOT NULL,
  "comment" TEXT,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "task_review_history_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "task_review_history_task_id_fkey"
    FOREIGN KEY ("task_id") REFERENCES "tasks"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX "task_review_history_task_id_idx" ON "task_review_history"("task_id");
CREATE INDEX "task_review_history_created_at_idx" ON "task_review_history"("created_at");

INSERT INTO "task_review_history"
  ("id", "task_id", "from_stage", "to_stage", "actor_id", "actor_type", "created_at")
SELECT
  gen_random_uuid(),
  "id",
  'NOT_SUBMITTED'::"TaskReviewStage",
  "review_stage",
  "created_by",
  'LEGACY',
  "updated_at"
FROM "tasks"
WHERE "review_stage" <> 'NOT_SUBMITTED'::"TaskReviewStage";
