-- Publish only historical outputs that were already explicitly client-visible.
-- Internal tasks remain private and are not silently exposed.
UPDATE "tasks" t
SET "is_visible_to_client" = true
WHERE t."review_stage" = 'CLIENT_REVIEW'::"TaskReviewStage"
  AND EXISTS (
    SELECT 1
    FROM "deliverables" d
    WHERE d."task_id" = t."id"
      AND d."is_visible_to_client" = true
  );

UPDATE "deliverables" d
SET "status" = 'IN_REVIEW'::"TaskStatus"
WHERE d."is_visible_to_client" = true
  AND EXISTS (
    SELECT 1
    FROM "tasks" t
    WHERE t."id" = d."task_id"
      AND t."review_stage" = 'CLIENT_REVIEW'::"TaskReviewStage"
  );
