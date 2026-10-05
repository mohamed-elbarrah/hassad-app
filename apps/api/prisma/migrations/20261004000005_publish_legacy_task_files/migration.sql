UPDATE "task_files" f
SET "purpose" = 'DELIVERABLE'::"FilePurpose"
WHERE f."purpose" <> 'INTERNAL_DRAFT'::"FilePurpose"
  AND EXISTS (
    SELECT 1
    FROM "tasks" t
    WHERE t."id" = f."task_id"
      AND t."review_stage" = 'CLIENT_REVIEW'::"TaskReviewStage"
      AND t."is_visible_to_client" = true
  );
