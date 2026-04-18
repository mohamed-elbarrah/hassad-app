/*
  Warnings:

  - You are about to drop the column `body` on the `Notification` table. All the data in the column will be lost.
  - You are about to drop the column `referenceId` on the `Notification` table. All the data in the column will be lost.
  - Added the required column `message` to the `Notification` table without a default value. This is not possible if the table is not empty.

*/
-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "NotificationType" ADD VALUE 'TASK_UPDATED';
ALTER TYPE "NotificationType" ADD VALUE 'TASK_COMMENT_ADDED';
ALTER TYPE "NotificationType" ADD VALUE 'TASK_FILE_UPLOADED';
ALTER TYPE "NotificationType" ADD VALUE 'TASK_OVERDUE';
ALTER TYPE "NotificationType" ADD VALUE 'TASK_DELAY_WARNING';
ALTER TYPE "NotificationType" ADD VALUE 'TASK_ESCALATED_PM';
ALTER TYPE "NotificationType" ADD VALUE 'TASK_ESCALATED_ADMIN';
ALTER TYPE "NotificationType" ADD VALUE 'ADMIN_BROADCAST';
ALTER TYPE "NotificationType" ADD VALUE 'SYSTEM_ALERT';

-- DropForeignKey
ALTER TABLE "Notification" DROP CONSTRAINT "Notification_userId_fkey";

-- AlterTable
ALTER TABLE "Notification" DROP COLUMN "body",
DROP COLUMN "referenceId",
ADD COLUMN     "entityId" TEXT,
ADD COLUMN     "entityType" TEXT,
ADD COLUMN     "message" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "Task" ADD COLUMN     "escalationLevel" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "escalationNotifiedAt" TIMESTAMP(3),
ADD COLUMN     "startDate" TIMESTAMP(3);

-- CreateIndex
CREATE INDEX "Task_escalationLevel_idx" ON "Task"("escalationLevel");

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
