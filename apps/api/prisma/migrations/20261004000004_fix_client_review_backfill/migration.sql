-- Ensure existing client-review tasks and linked deliverables are actually
-- available to the client, including previously hidden deliverable rows.
UPDATE "tasks" t
SET "is_visible_to_client" = true
WHERE t."review_stage" = 'CLIENT_REVIEW'::"TaskReviewStage"
  AND EXISTS (
    SELECT 1
    FROM "task_files" f
    WHERE f."task_id" = t."id"
      AND f."purpose" <> 'INTERNAL_DRAFT'::"FilePurpose"
  );

UPDATE "deliverables" d
SET "status" = 'IN_REVIEW'::"TaskStatus",
    "is_visible_to_client" = true
WHERE EXISTS (
  SELECT 1
  FROM "tasks" t
  WHERE t."id" = d."task_id"
    AND t."review_stage" = 'CLIENT_REVIEW'::"TaskReviewStage"
    AND t."is_visible_to_client" = true
);

INSERT INTO "deliverables"
  ("id", "project_id", "task_id", "title", "description", "file_path", "status", "is_visible_to_client", "period_id")
SELECT DISTINCT ON (t."id")
  gen_random_uuid(),
  t."project_id",
  t."id",
  t."title",
  t."description",
  f."file_path",
  'IN_REVIEW'::"TaskStatus",
  true,
  t."period_id"
FROM "tasks" t
JOIN "task_files" f ON f."task_id" = t."id"
WHERE t."review_stage" = 'CLIENT_REVIEW'::"TaskReviewStage"
  AND t."is_visible_to_client" = true
  AND f."purpose" <> 'INTERNAL_DRAFT'::"FilePurpose"
  AND NOT EXISTS (
    SELECT 1 FROM "deliverables" d WHERE d."task_id" = t."id"
  )
ORDER BY t."id", f."uploaded_at" DESC;
