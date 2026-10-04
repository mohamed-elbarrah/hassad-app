-- Preserve the existing lifecycle while making the review owner explicit.
-- DONE historically meant PM approval. Historical completed projects receive a
-- legacy marker, not a fabricated client approval timestamp.
UPDATE "tasks"
SET "review_stage" = CASE
  WHEN "status" = 'IN_REVIEW' THEN 'PM_REVIEW'::"TaskReviewStage"
  WHEN "status" = 'REVISION' THEN 'PM_REVISION_REQUESTED'::"TaskReviewStage"
  WHEN "status" = 'DONE' AND EXISTS (
    SELECT 1
    FROM "projects" p
    WHERE p."id" = "tasks"."project_id"
      AND p."status" = 'COMPLETED'
  ) THEN 'LEGACY_COMPLETED'::"TaskReviewStage"
  WHEN "status" = 'DONE' THEN 'CLIENT_REVIEW'::"TaskReviewStage"
  ELSE 'NOT_SUBMITTED'::"TaskReviewStage"
END,
"client_approved_at" = NULL,
"pm_accepted_at" = CASE
  WHEN "status" = 'DONE' THEN "updated_at"
  ELSE NULL
END
WHERE "review_stage" = 'NOT_SUBMITTED';
