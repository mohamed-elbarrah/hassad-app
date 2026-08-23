UPDATE "notification_templates"
SET
  "translation_key" = COALESCE("translation_key", 'notifications.' || lower("event_type")),
  "metadata_schema" = COALESCE("metadata_schema", '{}'::jsonb)
WHERE "translation_key" IS NULL OR "metadata_schema" IS NULL;
