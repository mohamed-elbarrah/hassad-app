-- Remove announcement priority, issue severity, and staff assignment from the
-- communication workflows. Historical issue events are retained for auditing.

DROP INDEX "issue_reports_status_severity_idx";
DROP INDEX "issue_reports_assigned_to_id_idx";
ALTER TABLE "issue_reports" DROP CONSTRAINT "issue_reports_assigned_to_id_fkey";
ALTER TABLE "issue_reports" DROP COLUMN "severity";
ALTER TABLE "issue_reports" DROP COLUMN "assigned_to_id";
DROP TYPE "issue_severities";

ALTER TABLE "announcements" DROP COLUMN "priority";
DROP TYPE "announcement_priorities";

CREATE INDEX "issue_reports_status_idx" ON "issue_reports"("status");
