-- AlterTable
ALTER TABLE "dispute_tickets" ADD COLUMN     "reminder1_sent_at" TIMESTAMP(3),
ADD COLUMN     "reminder2_sent_at" TIMESTAMP(3),
ADD COLUMN     "reminder3_sent_at" TIMESTAMP(3);
