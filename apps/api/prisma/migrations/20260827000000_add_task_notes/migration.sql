CREATE TABLE "task_notes" (
    "id" TEXT NOT NULL,
    "task_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "task_notes_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "task_notes_task_id_created_at_idx" ON "task_notes"("task_id", "created_at");
ALTER TABLE "task_notes" ADD CONSTRAINT "task_notes_task_id_fkey" FOREIGN KEY ("task_id") REFERENCES "tasks"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "task_notes" ADD CONSTRAINT "task_notes_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Preserve existing private task comments as private notes before comments become public-only.
INSERT INTO "task_notes" ("id", "task_id", "user_id", "content", "created_at", "updated_at")
SELECT gen_random_uuid()::text, "task_id", "user_id", "content", "created_at", "created_at"
FROM "task_comments"
WHERE "is_internal" = true;

DELETE FROM "task_comments" WHERE "is_internal" = true;
