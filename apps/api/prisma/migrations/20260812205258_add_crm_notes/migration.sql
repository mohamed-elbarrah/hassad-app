-- CreateTable
CREATE TABLE "crm_notes" (
    "id" TEXT NOT NULL,
    "lead_id" TEXT,
    "request_id" TEXT,
    "author_id" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "is_internal" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "crm_notes_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "crm_notes_lead_id_idx" ON "crm_notes"("lead_id");

-- CreateIndex
CREATE INDEX "crm_notes_request_id_idx" ON "crm_notes"("request_id");

-- CreateIndex
CREATE INDEX "crm_notes_created_at_idx" ON "crm_notes"("created_at");

-- AddForeignKey
ALTER TABLE "crm_notes" ADD CONSTRAINT "crm_notes_lead_id_fkey" FOREIGN KEY ("lead_id") REFERENCES "leads"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "crm_notes" ADD CONSTRAINT "crm_notes_request_id_fkey" FOREIGN KEY ("request_id") REFERENCES "requests"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "crm_notes" ADD CONSTRAINT "crm_notes_author_id_fkey" FOREIGN KEY ("author_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
