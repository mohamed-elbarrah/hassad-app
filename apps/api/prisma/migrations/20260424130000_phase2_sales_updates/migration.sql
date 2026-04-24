-- CreateEnum
CREATE TYPE "PipelineStage_new" AS ENUM (
  'NEW_LEAD',
  'INTRO_MESSAGE',
  'CONTACT_ATTEMPT',
  'MEETING_SCHEDULED',
  'MEETING_HELD',
  'PROPOSAL',
  'FOLLOW_UP',
  'APPROVAL',
  'CONTRACT_SIGNED'
);

-- AlterEnum
ALTER TABLE "Client" ALTER COLUMN "stage" DROP DEFAULT;
ALTER TABLE "Client" ALTER COLUMN "stage" TYPE "PipelineStage_new" USING (
  CASE "stage"
    WHEN 'NEW_LEAD' THEN 'NEW_LEAD'
    WHEN 'CONTACTED' THEN 'CONTACT_ATTEMPT'
    WHEN 'MEETING_SCHEDULED' THEN 'MEETING_SCHEDULED'
    WHEN 'REQUIREMENTS_GATHERING' THEN 'MEETING_HELD'
    WHEN 'PROPOSAL_SENT' THEN 'PROPOSAL'
    WHEN 'NEGOTIATION' THEN 'FOLLOW_UP'
    WHEN 'WAITING_FOR_SIGNATURE' THEN 'APPROVAL'
    WHEN 'CONTRACTED_WON' THEN 'CONTRACT_SIGNED'
    WHEN 'HANDOVER' THEN 'CONTRACT_SIGNED'
    ELSE 'NEW_LEAD'
  END
)::"PipelineStage_new";
ALTER TYPE "PipelineStage" RENAME TO "PipelineStage_old";
ALTER TYPE "PipelineStage_new" RENAME TO "PipelineStage";
DROP TYPE "PipelineStage_old";
ALTER TABLE "Client" ALTER COLUMN "stage" SET DEFAULT 'NEW_LEAD';

-- CreateEnum
CREATE TYPE "ContactOutcome" AS ENUM ('NO_RESPONSE', 'RESPONDED');

-- CreateEnum
CREATE TYPE "ProposalStatus" AS ENUM (
  'DRAFT',
  'SENT',
  'APPROVED',
  'REVISION_REQUESTED',
  'REJECTED'
);

-- CreateEnum
CREATE TYPE "ContractStatus" AS ENUM ('DRAFT', 'SENT', 'SIGNED');

-- AlterTable
ALTER TABLE "Client"
  ADD COLUMN "contactAttempts" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN "lastContactAttemptAt" TIMESTAMP(3),
  ADD COLUMN "nextFollowUpAt" TIMESTAMP(3),
  ADD COLUMN "followUpStep" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "ClientActivity" ADD COLUMN "metadata" JSONB;

-- AlterTable
ALTER TABLE "Contract" ALTER COLUMN "status" TYPE "ContractStatus" USING (
  CASE
    WHEN "status" = 'SENT' THEN 'SENT'
    WHEN "status" = 'SIGNED' THEN 'SIGNED'
    ELSE 'DRAFT'
  END
)::"ContractStatus";

ALTER TABLE "Contract"
  ADD COLUMN "fileUrl" TEXT,
  ADD COLUMN "sentAt" TIMESTAMP(3),
  ADD COLUMN "signedAt" TIMESTAMP(3),
  ADD COLUMN "signedByName" TEXT,
  ADD COLUMN "signedByEmail" TEXT,
  ADD COLUMN "signatureUrl" TEXT;

-- CreateTable
CREATE TABLE "Proposal" (
  "id" TEXT NOT NULL,
  "clientId" TEXT NOT NULL,
  "services" JSONB NOT NULL,
  "price" DOUBLE PRECISION NOT NULL,
  "startDate" TIMESTAMP(3) NOT NULL,
  "notes" TEXT,
  "status" "ProposalStatus" NOT NULL DEFAULT 'DRAFT',
  "shareToken" TEXT,
  "sentAt" TIMESTAMP(3),
  "approvedAt" TIMESTAMP(3),
  "revisionNotes" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "Proposal_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Proposal_shareToken_key" ON "Proposal"("shareToken");

-- CreateIndex
CREATE INDEX "Proposal_clientId_idx" ON "Proposal"("clientId");

-- CreateIndex
CREATE INDEX "Proposal_status_idx" ON "Proposal"("status");

-- CreateIndex
CREATE INDEX "Client_nextFollowUpAt_idx" ON "Client"("nextFollowUpAt");

-- AddForeignKey
ALTER TABLE "Proposal" ADD CONSTRAINT "Proposal_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE CASCADE ON UPDATE CASCADE;
