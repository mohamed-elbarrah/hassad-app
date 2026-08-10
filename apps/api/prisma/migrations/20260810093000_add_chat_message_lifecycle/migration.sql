ALTER TABLE "messages"
ADD COLUMN "parent_message_id" TEXT,
ADD COLUMN "edited_at" TIMESTAMP(3),
ADD COLUMN "deleted_at" TIMESTAMP(3),
ADD COLUMN "deleted_by_id" TEXT;

ALTER TABLE "messages"
ADD CONSTRAINT "messages_parent_message_id_fkey"
FOREIGN KEY ("parent_message_id") REFERENCES "messages"("id")
ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "messages"
ADD CONSTRAINT "messages_deleted_by_id_fkey"
FOREIGN KEY ("deleted_by_id") REFERENCES "users"("id")
ON DELETE SET NULL ON UPDATE CASCADE;

CREATE INDEX "messages_parent_message_id_idx" ON "messages"("parent_message_id");
CREATE INDEX "messages_deleted_by_id_idx" ON "messages"("deleted_by_id");
