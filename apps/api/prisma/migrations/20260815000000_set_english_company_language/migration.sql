-- V2 backend baseline is English. Only change the legacy default value;
-- preserve any explicit administrator choice made after initialization.
UPDATE "company_settings"
SET "value" = '"en"'::jsonb
WHERE "key" = 'language'
  AND "value" = '"ar"'::jsonb;
