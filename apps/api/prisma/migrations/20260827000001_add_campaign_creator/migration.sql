ALTER TABLE "campaigns" ADD COLUMN "created_by" TEXT;

UPDATE "campaigns"
SET "created_by" = "managed_by"
WHERE "created_by" IS NULL;

CREATE INDEX "campaigns_created_by_idx" ON "campaigns"("created_by");
ALTER TABLE "campaigns" ADD CONSTRAINT "campaigns_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
