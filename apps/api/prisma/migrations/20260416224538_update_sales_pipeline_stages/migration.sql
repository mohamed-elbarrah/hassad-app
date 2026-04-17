/*
  Warnings:

  - The values [PAUSED,CLOSED] on the enum `ClientStatus` will be removed. If these variants are still used in the database, this will fail.
  - You are about to drop the column `assignedTo` on the `Client` table. All the data in the column will be lost.
  - You are about to drop the column `businessName` on the `Client` table. All the data in the column will be lost.
  - You are about to drop the column `notes` on the `Client` table. All the data in the column will be lost.
  - You are about to drop the column `pipelineStage` on the `Client` table. All the data in the column will be lost.
  - Added the required column `assignedToId` to the `Client` table without a default value. This is not possible if the table is not empty.
  - Changed the type of `businessType` on the `Client` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `source` on the `Client` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- CreateEnum
CREATE TYPE "PipelineStage" AS ENUM ('NEW_LEAD', 'CONTACTED', 'MEETING_SCHEDULED', 'REQUIREMENTS_GATHERING', 'PROPOSAL_SENT', 'NEGOTIATION', 'WAITING_FOR_SIGNATURE', 'CONTRACTED_WON', 'HANDOVER');

-- CreateEnum
CREATE TYPE "BusinessType" AS ENUM ('RESTAURANT', 'CLINIC', 'STORE', 'SERVICE');

-- CreateEnum
CREATE TYPE "ClientSource" AS ENUM ('AD', 'REFERRAL', 'WEBSITE', 'WHATSAPP', 'PLATFORM');

-- AlterEnum
BEGIN;
CREATE TYPE "ClientStatus_new" AS ENUM ('LEAD', 'ACTIVE', 'STOPPED');
ALTER TABLE "public"."Client" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "Client" ALTER COLUMN "status" TYPE "ClientStatus_new" USING ("status"::text::"ClientStatus_new");
ALTER TYPE "ClientStatus" RENAME TO "ClientStatus_old";
ALTER TYPE "ClientStatus_new" RENAME TO "ClientStatus";
DROP TYPE "public"."ClientStatus_old";
ALTER TABLE "Client" ALTER COLUMN "status" SET DEFAULT 'LEAD';
COMMIT;

-- DropForeignKey
ALTER TABLE "Client" DROP CONSTRAINT "Client_assignedTo_fkey";

-- AlterTable
ALTER TABLE "Client" DROP COLUMN "assignedTo",
DROP COLUMN "businessName",
DROP COLUMN "notes",
DROP COLUMN "pipelineStage",
ADD COLUMN     "activityLog" JSONB,
ADD COLUMN     "assignedToId" TEXT NOT NULL,
ADD COLUMN     "requirements" JSONB,
ADD COLUMN     "stage" "PipelineStage" NOT NULL DEFAULT 'NEW_LEAD',
DROP COLUMN "businessType",
ADD COLUMN     "businessType" "BusinessType" NOT NULL,
DROP COLUMN "source",
ADD COLUMN     "source" "ClientSource" NOT NULL;

-- CreateIndex
CREATE INDEX "Client_status_idx" ON "Client"("status");

-- CreateIndex
CREATE INDEX "Client_stage_idx" ON "Client"("stage");

-- CreateIndex
CREATE INDEX "Client_assignedToId_idx" ON "Client"("assignedToId");

-- CreateIndex
CREATE INDEX "ClientActivity_clientId_idx" ON "ClientActivity"("clientId");

-- AddForeignKey
ALTER TABLE "Client" ADD CONSTRAINT "Client_assignedToId_fkey" FOREIGN KEY ("assignedToId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
