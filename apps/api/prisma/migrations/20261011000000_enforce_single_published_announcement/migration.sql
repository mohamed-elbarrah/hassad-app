-- Keep the newest currently published announcement and archive older duplicates
-- before enforcing a single published record globally.
WITH ranked_published AS (
  SELECT
    "id",
    ROW_NUMBER() OVER (
      ORDER BY "published_at" DESC NULLS LAST, "created_at" DESC, "id" DESC
    ) AS row_number
  FROM "announcements"
  WHERE "status" = 'PUBLISHED'
)
UPDATE "announcements" AS announcement
SET "status" = 'ARCHIVED',
    "archived_at" = COALESCE(announcement."archived_at", CURRENT_TIMESTAMP)
FROM ranked_published
WHERE announcement."id" = ranked_published."id"
  AND ranked_published.row_number > 1;

CREATE UNIQUE INDEX "announcements_single_published_idx"
  ON "announcements" ("status")
  WHERE "status" = 'PUBLISHED';
