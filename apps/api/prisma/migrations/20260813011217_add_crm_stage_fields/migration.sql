-- CreateEnum
CREATE TYPE "CrmStage" AS ENUM ('NEW', 'SCHEDULED', 'DONE', 'FAILED', 'SENT', 'NEGOTIATION', 'APPROVED', 'REJECTED', 'CONTRACT_SENT', 'SIGNED', 'ACTIVE', 'CANCELLED');

-- AlterTable
ALTER TABLE "leads" ADD COLUMN     "crm_stage" "CrmStage" NOT NULL DEFAULT 'NEW';

-- AlterTable
ALTER TABLE "requests" ADD COLUMN     "crm_stage" "CrmStage" NOT NULL DEFAULT 'NEW';

-- Backfill CRM stages from existing request statuses and lead pipeline stages
UPDATE "requests"
SET "crm_stage" = CASE "status"
  WHEN 'SUBMITTED' THEN 'NEW'::"CrmStage"
  WHEN 'QUALIFYING' THEN 'SCHEDULED'::"CrmStage"
  WHEN 'PROPOSAL_IN_PROGRESS' THEN 'DONE'::"CrmStage"
  WHEN 'PROPOSAL_SENT' THEN 'SENT'::"CrmStage"
  WHEN 'NEGOTIATION' THEN 'NEGOTIATION'::"CrmStage"
  WHEN 'CONTRACT_PREPARATION' THEN 'APPROVED'::"CrmStage"
  WHEN 'CONTRACT_SENT' THEN 'CONTRACT_SENT'::"CrmStage"
  WHEN 'SIGNED' THEN 'SIGNED'::"CrmStage"
  WHEN 'PROJECT_CREATED' THEN 'ACTIVE'::"CrmStage"
  WHEN 'CANCELLED' THEN 'CANCELLED'::"CrmStage"
  ELSE 'NEW'::"CrmStage"
END;

UPDATE "leads" l
SET "crm_stage" = COALESCE(r."crm_stage", CASE l."pipeline_stage"
  WHEN 'NEW' THEN 'NEW'::"CrmStage"
  WHEN 'INTRO_SENT' THEN 'SCHEDULED'::"CrmStage"
  WHEN 'CALL_ATTEMPT' THEN 'FAILED'::"CrmStage"
  WHEN 'MEETING_SCHEDULED' THEN 'SCHEDULED'::"CrmStage"
  WHEN 'MEETING_DONE' THEN 'DONE'::"CrmStage"
  WHEN 'PROPOSAL_SENT' THEN 'SENT'::"CrmStage"
  WHEN 'FOLLOW_UP' THEN 'NEGOTIATION'::"CrmStage"
  WHEN 'APPROVED' THEN 'APPROVED'::"CrmStage"
  WHEN 'CONTRACT_SIGNED' THEN 'SIGNED'::"CrmStage"
  ELSE 'NEW'::"CrmStage"
END)
FROM "requests" r
WHERE r."id" = l."request_id";

UPDATE "leads"
SET "crm_stage" = CASE "pipeline_stage"
  WHEN 'NEW' THEN 'NEW'::"CrmStage"
  WHEN 'INTRO_SENT' THEN 'SCHEDULED'::"CrmStage"
  WHEN 'CALL_ATTEMPT' THEN 'FAILED'::"CrmStage"
  WHEN 'MEETING_SCHEDULED' THEN 'SCHEDULED'::"CrmStage"
  WHEN 'MEETING_DONE' THEN 'DONE'::"CrmStage"
  WHEN 'PROPOSAL_SENT' THEN 'SENT'::"CrmStage"
  WHEN 'FOLLOW_UP' THEN 'NEGOTIATION'::"CrmStage"
  WHEN 'APPROVED' THEN 'APPROVED'::"CrmStage"
  WHEN 'CONTRACT_SIGNED' THEN 'SIGNED'::"CrmStage"
  ELSE 'NEW'::"CrmStage"
END
WHERE "request_id" IS NULL;
