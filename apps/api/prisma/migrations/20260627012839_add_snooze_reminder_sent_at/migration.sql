-- AlterTable
ALTER TABLE "client_snoozed_items" ADD COLUMN     "reminder_sent_at" TIMESTAMP(3);

-- CreateIndex
CREATE INDEX "client_snoozed_items_reminder_sent_at_idx" ON "client_snoozed_items"("reminder_sent_at");
