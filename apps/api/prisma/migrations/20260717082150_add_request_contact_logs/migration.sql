-- Add NOT_INTERESTED to ContactLogResult enum
ALTER TYPE "ContactLogResult" ADD VALUE 'NOT_INTERESTED';

-- Add contact tracking fields to requests table
ALTER TABLE "requests" ADD COLUMN "contact_attempt_count" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "requests" ADD COLUMN "last_contact_at" TIMESTAMPTZ;

-- Create request_contact_logs table
CREATE TABLE "request_contact_logs" (
    "id" TEXT NOT NULL,
    "request_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "type" "ContactLogType" NOT NULL,
    "result" "ContactLogResult" NOT NULL,
    "notes" TEXT,
    "contacted_at" TIMESTAMPTZ NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "request_contact_logs_pkey" PRIMARY KEY ("id")
);

-- Create indexes
CREATE INDEX "request_contact_logs_request_id_idx" ON "request_contact_logs"("request_id");
CREATE INDEX "request_contact_logs_user_id_idx" ON "request_contact_logs"("user_id");

-- Add foreign key constraints
ALTER TABLE "request_contact_logs" ADD CONSTRAINT "request_contact_logs_request_id_fkey" FOREIGN KEY ("request_id") REFERENCES "requests"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "request_contact_logs" ADD CONSTRAINT "request_contact_logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
