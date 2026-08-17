DO $$
BEGIN
  CREATE TYPE "dispute_thread_types" AS ENUM ('CLIENT_PM', 'ADMIN_CLIENT', 'ADMIN_PM');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

ALTER TABLE "dispute_messages"
ADD COLUMN IF NOT EXISTS "thread_type" "dispute_thread_types" NOT NULL DEFAULT 'CLIENT_PM';

CREATE INDEX IF NOT EXISTS "dispute_messages_ticket_id_thread_type_created_at_idx"
ON "dispute_messages"("ticket_id", "thread_type", "created_at");
