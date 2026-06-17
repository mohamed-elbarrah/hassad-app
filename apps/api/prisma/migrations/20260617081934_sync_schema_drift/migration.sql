-- CreateEnum (guarded: a previous partial run may have already created this type)
DROP TYPE IF EXISTS "MarketingStrategyStatus";
CREATE TYPE "MarketingStrategyStatus" AS ENUM ('DRAFT', 'SENT', 'APPROVED', 'REVISION_REQUESTED', 'REJECTED');

-- AlterEnum (idempotent: 'DIRECT' may already exist from a previous partial run)
ALTER TYPE "ClientSource" ADD VALUE IF NOT EXISTS 'DIRECT';

-- AlterEnum — ConversationType: (SALES, PM) -> (DIRECT, GROUP)
-- Existing rows hold SALES/PM, so a blind cast would fail. Map by participant count:
--   <= 2 participants -> DIRECT (1:1),  > 2 participants -> GROUP.
BEGIN;
DROP TYPE IF EXISTS "ConversationType_new";
CREATE TYPE "ConversationType_new" AS ENUM ('DIRECT', 'GROUP');
-- Safe conversion: default every existing row to DIRECT (always valid), then promote
-- multi-participant conversations to GROUP.
ALTER TABLE "conversations" ALTER COLUMN "type" TYPE "ConversationType_new" USING ('DIRECT'::"ConversationType_new");
ALTER TYPE "ConversationType" RENAME TO "ConversationType_old";
ALTER TYPE "ConversationType_new" RENAME TO "ConversationType";
UPDATE "conversations" SET "type" = 'GROUP'
  WHERE "id" IN (
    SELECT "conversation_id" FROM "conversation_participants"
    GROUP BY "conversation_id" HAVING count(*) > 2
  );
DROP TYPE IF EXISTS "public"."ConversationType_old";
COMMIT;

-- DropForeignKey (idempotent)
ALTER TABLE "conversations" DROP CONSTRAINT IF EXISTS "conversations_client_id_fkey";

-- AlterTable
ALTER TABLE "clients" ADD COLUMN IF NOT EXISTS "active_projects" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS "avg_satisfaction_score" DOUBLE PRECISION,
ADD COLUMN IF NOT EXISTS "cancelled_projects" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS "completed_projects" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS "last_project_at" TIMESTAMP(3),
ADD COLUMN IF NOT EXISTS "total_contract_value" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS "total_invoiced" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS "total_paid" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS "total_projects" INTEGER NOT NULL DEFAULT 0;

-- AlterTable — conversations: updated_at is NOT NULL with no default, so add it with a
-- default to backfill existing rows, then drop the default to match the schema.
ALTER TABLE "conversations" ADD COLUMN IF NOT EXISTS "project_id" TEXT,
ADD COLUMN IF NOT EXISTS "updated_at" TIMESTAMP(3) NOT NULL DEFAULT now(),
ALTER COLUMN "client_id" DROP NOT NULL,
ALTER COLUMN "title" DROP NOT NULL;
ALTER TABLE "conversations" ALTER COLUMN "updated_at" DROP DEFAULT;

-- CreateTable
CREATE TABLE IF NOT EXISTS "client_profile" (
    "id" TEXT NOT NULL,
    "client_id" TEXT NOT NULL,
    "industry" TEXT,
    "business_description" TEXT,
    "target_audience" TEXT,
    "budget_range_min" DOUBLE PRECISION,
    "budget_range_max" DOUBLE PRECISION,
    "communication_preference" TEXT,
    "preferred_language" TEXT DEFAULT 'ar',
    "timezone" TEXT DEFAULT 'Asia/Riyadh',
    "preferred_platforms" TEXT,
    "brand_assets" JSONB,
    "custom_fields" JSONB,
    "website" TEXT,
    "instagram_handle" TEXT,
    "tiktok_handle" TEXT,
    "twitter_handle" TEXT,
    "linkedin_url" TEXT,
    "snapchat_handle" TEXT,
    "working_hours" TEXT,
    "decision_maker_name" TEXT,
    "decision_maker_phone" TEXT,
    "pain_points" TEXT,
    "created_by" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "client_profile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "marketing_strategies" (
    "id" TEXT NOT NULL,
    "task_id" TEXT NOT NULL,
    "created_by" TEXT NOT NULL,
    "client_id" TEXT NOT NULL,
    "project_id" TEXT,
    "status" "MarketingStrategyStatus" NOT NULL DEFAULT 'DRAFT',
    "file_name" TEXT NOT NULL,
    "file_path" TEXT NOT NULL,
    "file_size" INTEGER NOT NULL,
    "file_type" TEXT NOT NULL DEFAULT 'application/pdf',
    "revision_note" TEXT,
    "approved_by" TEXT,
    "approved_at" TIMESTAMP(3),
    "sent_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "marketing_strategies_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "client_profile_client_id_key" ON "client_profile"("client_id");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "client_profile_client_id_idx" ON "client_profile"("client_id");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "marketing_strategies_task_id_idx" ON "marketing_strategies"("task_id");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "marketing_strategies_client_id_idx" ON "marketing_strategies"("client_id");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "marketing_strategies_status_idx" ON "marketing_strategies"("status");

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "conversations_project_id_key" ON "conversations"("project_id");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "conversations_project_id_idx" ON "conversations"("project_id");

-- AddForeignKey
ALTER TABLE "client_profile" ADD CONSTRAINT "client_profile_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "clients"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "marketing_strategies" ADD CONSTRAINT "marketing_strategies_task_id_fkey" FOREIGN KEY ("task_id") REFERENCES "tasks"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "marketing_strategies" ADD CONSTRAINT "marketing_strategies_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "marketing_strategies" ADD CONSTRAINT "marketing_strategies_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "clients"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "marketing_strategies" ADD CONSTRAINT "marketing_strategies_approved_by_fkey" FOREIGN KEY ("approved_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "marketing_strategies" ADD CONSTRAINT "marketing_strategies_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "conversations" ADD CONSTRAINT "conversations_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "clients"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "conversations" ADD CONSTRAINT "conversations_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE SET NULL ON UPDATE CASCADE;