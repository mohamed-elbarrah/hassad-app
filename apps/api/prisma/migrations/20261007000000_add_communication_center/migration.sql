CREATE TYPE "announcement_statuses" AS ENUM ('DRAFT', 'SCHEDULED', 'PUBLISHED', 'ARCHIVED');
CREATE TYPE "announcement_types" AS ENUM ('INFO', 'SUCCESS', 'WARNING', 'CRITICAL');
CREATE TYPE "announcement_priorities" AS ENUM ('LOW', 'NORMAL', 'HIGH', 'CRITICAL');
CREATE TYPE "announcement_audience_types" AS ENUM ('ALL_STAFF', 'ADMIN', 'PM', 'SALES', 'MARKETING', 'ACCOUNTANT', 'TEAM', 'CLIENT_PORTAL');
CREATE TYPE "issue_report_sources" AS ENUM ('DASHBOARD', 'PORTAL');
CREATE TYPE "issue_categories" AS ENUM ('BUG', 'PERFORMANCE', 'ACCESS', 'DATA', 'PAYMENT', 'OTHER');
CREATE TYPE "issue_severities" AS ENUM ('LOW', 'NORMAL', 'HIGH', 'CRITICAL');
CREATE TYPE "issue_statuses" AS ENUM ('OPEN', 'IN_PROGRESS', 'WAITING_FOR_USER', 'RESOLVED', 'CLOSED');

CREATE TABLE "announcements" (
  "id" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "body" TEXT NOT NULL,
  "type" "announcement_types" NOT NULL DEFAULT 'INFO',
  "priority" "announcement_priorities" NOT NULL DEFAULT 'NORMAL',
  "status" "announcement_statuses" NOT NULL DEFAULT 'DRAFT',
  "starts_at" TIMESTAMP(3),
  "expires_at" TIMESTAMP(3),
  "allow_dismissal" BOOLEAN NOT NULL DEFAULT true,
  "action_label" TEXT,
  "action_url" TEXT,
  "created_by_id" TEXT NOT NULL,
  "published_at" TIMESTAMP(3),
  "archived_at" TIMESTAMP(3),
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "announcements_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "announcement_audiences" (
  "id" TEXT NOT NULL,
  "announcement_id" TEXT NOT NULL,
  "audience" "announcement_audience_types" NOT NULL,
  CONSTRAINT "announcement_audiences_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "announcement_user_states" (
  "id" TEXT NOT NULL,
  "announcement_id" TEXT NOT NULL,
  "user_id" TEXT NOT NULL,
  "viewed_at" TIMESTAMP(3),
  "dismissed_at" TIMESTAMP(3),
  CONSTRAINT "announcement_user_states_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "issue_reports" (
  "id" TEXT NOT NULL,
  "report_number" SERIAL NOT NULL,
  "reporter_id" TEXT NOT NULL,
  "source" "issue_report_sources" NOT NULL,
  "category" "issue_categories" NOT NULL,
  "severity" "issue_severities" NOT NULL DEFAULT 'NORMAL',
  "status" "issue_statuses" NOT NULL DEFAULT 'OPEN',
  "title" TEXT NOT NULL,
  "description" TEXT NOT NULL,
  "page_path" TEXT,
  "assigned_to_id" TEXT,
  "resolved_at" TIMESTAMP(3),
  "closed_at" TIMESTAMP(3),
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "issue_reports_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "issue_messages" (
  "id" TEXT NOT NULL,
  "issue_id" TEXT NOT NULL,
  "author_id" TEXT NOT NULL,
  "content" TEXT NOT NULL,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "issue_messages_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "issue_history" (
  "id" TEXT NOT NULL,
  "issue_id" TEXT NOT NULL,
  "changed_by" TEXT NOT NULL,
  "event_code" TEXT NOT NULL,
  "metadata" JSONB,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "issue_history_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "announcement_audiences_announcement_id_audience_key" ON "announcement_audiences"("announcement_id", "audience");
CREATE UNIQUE INDEX "announcement_user_states_announcement_id_user_id_key" ON "announcement_user_states"("announcement_id", "user_id");
CREATE UNIQUE INDEX "issue_reports_report_number_key" ON "issue_reports"("report_number");
CREATE INDEX "announcements_status_starts_at_expires_at_idx" ON "announcements"("status", "starts_at", "expires_at");
CREATE INDEX "announcements_created_at_idx" ON "announcements"("created_at");
CREATE INDEX "announcement_user_states_user_id_viewed_at_idx" ON "announcement_user_states"("user_id", "viewed_at");
CREATE INDEX "issue_reports_reporter_id_idx" ON "issue_reports"("reporter_id");
CREATE INDEX "issue_reports_status_severity_idx" ON "issue_reports"("status", "severity");
CREATE INDEX "issue_reports_assigned_to_id_idx" ON "issue_reports"("assigned_to_id");
CREATE INDEX "issue_reports_created_at_idx" ON "issue_reports"("created_at");
CREATE INDEX "issue_messages_issue_id_created_at_idx" ON "issue_messages"("issue_id", "created_at");
CREATE INDEX "issue_history_issue_id_created_at_idx" ON "issue_history"("issue_id", "created_at");
ALTER TABLE "announcements" ADD CONSTRAINT "announcements_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "announcement_audiences" ADD CONSTRAINT "announcement_audiences_announcement_id_fkey" FOREIGN KEY ("announcement_id") REFERENCES "announcements"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "announcement_user_states" ADD CONSTRAINT "announcement_user_states_announcement_id_fkey" FOREIGN KEY ("announcement_id") REFERENCES "announcements"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "announcement_user_states" ADD CONSTRAINT "announcement_user_states_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "issue_reports" ADD CONSTRAINT "issue_reports_reporter_id_fkey" FOREIGN KEY ("reporter_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "issue_reports" ADD CONSTRAINT "issue_reports_assigned_to_id_fkey" FOREIGN KEY ("assigned_to_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "issue_messages" ADD CONSTRAINT "issue_messages_issue_id_fkey" FOREIGN KEY ("issue_id") REFERENCES "issue_reports"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "issue_messages" ADD CONSTRAINT "issue_messages_author_id_fkey" FOREIGN KEY ("author_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "issue_history" ADD CONSTRAINT "issue_history_issue_id_fkey" FOREIGN KEY ("issue_id") REFERENCES "issue_reports"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "issue_history" ADD CONSTRAINT "issue_history_changed_by_fkey" FOREIGN KEY ("changed_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
