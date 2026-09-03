-- Add yearly snapshots and enforce one snapshot per report/period boundary.
ALTER TYPE "report_periods" ADD VALUE 'YEARLY';

-- Keep the newest row if a legacy deployment already generated duplicates.
DELETE FROM "report_snapshots" a
USING "report_snapshots" b
WHERE a."report_type" = b."report_type"
  AND a."period" = b."period"
  AND a."period_start" = b."period_start"
  AND (a."generated_at", a."id") < (b."generated_at", b."id");

DROP INDEX IF EXISTS "report_snapshots_report_type_period_period_start_idx";
CREATE UNIQUE INDEX "report_snapshots_report_type_period_period_start_key"
  ON "report_snapshots" ("report_type", "period", "period_start");
