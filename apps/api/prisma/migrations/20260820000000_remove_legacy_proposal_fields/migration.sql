ALTER TABLE "proposals"
  DROP COLUMN IF EXISTS "platforms",
  DROP COLUMN IF EXISTS "contact_email",
  DROP COLUMN IF EXISTS "contact_name",
  DROP COLUMN IF EXISTS "offer_validity_days";
