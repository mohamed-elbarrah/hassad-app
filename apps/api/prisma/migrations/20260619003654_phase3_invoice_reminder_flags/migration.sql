-- AlterTable
ALTER TABLE "invoices" ADD COLUMN     "reminder_flags" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "triggered_suspension" BOOLEAN NOT NULL DEFAULT false;
