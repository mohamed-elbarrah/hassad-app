-- AlterTable
ALTER TABLE "request_contact_logs" ALTER COLUMN "contacted_at" SET DATA TYPE TIMESTAMP(3),
ALTER COLUMN "created_at" SET DATA TYPE TIMESTAMP(3);

-- AlterTable
ALTER TABLE "requests" ALTER COLUMN "last_contact_at" SET DATA TYPE TIMESTAMP(3);
