ALTER TABLE "notification_templates"
  ADD COLUMN "translation_key" TEXT,
  ADD COLUMN "metadata_schema" JSONB;
