-- Additive workflow fields. Existing task status remains intact for compatibility.
CREATE TYPE "TaskReviewStage" AS ENUM (
  'NOT_SUBMITTED',
  'PM_REVIEW',
  'PM_REVISION_REQUESTED',
  'CLIENT_REVIEW',
  'CLIENT_REVISION_REQUESTED',
  'CLIENT_APPROVED',
  'LEGACY_COMPLETED'
);

ALTER TABLE "tasks"
  ADD COLUMN "review_stage" "TaskReviewStage" NOT NULL DEFAULT 'NOT_SUBMITTED',
  ADD COLUMN "pm_accepted_at" TIMESTAMP(3),
  ADD COLUMN "client_approved_at" TIMESTAMP(3);

CREATE INDEX "tasks_review_stage_idx" ON "tasks"("review_stage");
