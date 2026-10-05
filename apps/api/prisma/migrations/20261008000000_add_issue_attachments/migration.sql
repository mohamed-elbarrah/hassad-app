CREATE TABLE "issue_attachments" (
  "id" TEXT NOT NULL,
  "issue_id" TEXT NOT NULL,
  "message_id" TEXT,
  "uploaded_by" TEXT NOT NULL,
  "file_name" TEXT NOT NULL,
  "file_path" TEXT NOT NULL,
  "file_size" INTEGER NOT NULL,
  "mime_type" TEXT NOT NULL,
  "uploaded_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "issue_attachments_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "issue_attachments_issue_id_uploaded_at_idx" ON "issue_attachments"("issue_id", "uploaded_at");
CREATE INDEX "issue_attachments_message_id_idx" ON "issue_attachments"("message_id");
ALTER TABLE "issue_attachments" ADD CONSTRAINT "issue_attachments_issue_id_fkey" FOREIGN KEY ("issue_id") REFERENCES "issue_reports"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "issue_attachments" ADD CONSTRAINT "issue_attachments_message_id_fkey" FOREIGN KEY ("message_id") REFERENCES "issue_messages"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "issue_attachments" ADD CONSTRAINT "issue_attachments_uploaded_by_fkey" FOREIGN KEY ("uploaded_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
