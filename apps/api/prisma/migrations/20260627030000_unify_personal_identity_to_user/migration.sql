-- ─────────────────────────────────────────────────────────────────────────
-- Unify personal identity to the User table (single source of truth)
--
-- BEFORE this migration:
--   `User`    owned: name, email
--   `Client`  owned: contactName, email, phoneWhatsapp (CRM-side copies)
--   `ClientProfile.communicationInfo` (JSON) also stored copies of
--     contactName, email, contactNumber, businessName
--
-- The three-table duplication caused /portal/account and /portal/profile
-- to show different names for the same person, and gave future code
-- three different places to write/update personal identity — a recipe
-- for silent drift.
--
-- AFTER this migration:
--   `User`    owns: name, email, phoneWhatsapp, avatarUrl
--   `Client`  owns ONLY business fields (companyName, businessName,
--             businessType, accountManager, status, counters)
--   `ClientProfile.communicationInfo` owns ONLY business/wizard fields
--             (businessName, industry, audience, campaign, etc.)
--
-- Personal identity (name, email, phone) exists in exactly one place:
-- the `User` row linked via `Client.userId`.
-- ─────────────────────────────────────────────────────────────────────────

-- ═════════════════════════════════════════════════════════════════════════
-- STEP 1: Backfill User fields from Client fields (non-destructive)
-- ═════════════════════════════════════════════════════════════════════════
--
-- We backfill before dropping the Client columns so any existing data
-- is preserved. The User is the canonical owner going forward; the
-- Client fields become read-only legacy until they're dropped in step 3.

-- Backfill User.phoneWhatsapp from Client.phoneWhatsapp where User is missing it
UPDATE "users" u
SET    phone_whatsapp = c.phone_whatsapp
FROM   "clients" c
WHERE  c.user_id = u.id
  AND  u.phone_whatsapp IS NULL
  AND  c.phone_whatsapp IS NOT NULL
  AND  c.phone_whatsapp != '';

-- Backfill User.name from Client.contactName where User name is NULL or empty.
-- (Usually the seed/CRM create flow already populates User.name, but this
-- protects against orphaned clients whose User was created without a name.)
UPDATE "users" u
SET    name = c.contact_name
FROM   "clients" c
WHERE  c.user_id = u.id
  AND  (u.name IS NULL OR u.name = '')
  AND  c.contact_name IS NOT NULL
  AND  c.contact_name != '';

-- ═════════════════════════════════════════════════════════════════════════
-- STEP 2: Clean ClientProfile.communicationInfo personal identity fields
-- ═════════════════════════════════════════════════════════════════════════
--
-- The V2 wizard used to write contactName, email, contactNumber into
-- communicationInfo (a third copy of personal identity). Those fields
-- have been removed from CommunicationInfoSchema. Clean existing rows so
-- no legacy data leaks into the portal view.

UPDATE "client_profile"
SET    communication_info = COALESCE(
           (SELECT jsonb_object_agg(key, value)
            FROM   jsonb_each(communication_info)
            WHERE  key NOT IN ('contactName', 'email', 'contactNumber')
                  AND key NOT LIKE 'contactName'
                  AND key NOT LIKE 'email'
                  AND key NOT LIKE 'contactNumber'),
           '{}'::jsonb
       )
WHERE  communication_info IS NOT NULL
  AND  (
           communication_info ? 'contactName'
        OR communication_info ? 'email'
        OR communication_info ? 'contactNumber'
       );

-- ═════════════════════════════════════════════════════════════════════════
-- STEP 3: Drop the duplicate columns from the Client table
-- ═════════════════════════════════════════════════════════════════════════
--
-- These columns are removed because their data is now in User (the
-- single source of truth). All code paths must read personal identity
-- from User via Client.userId → User.

ALTER TABLE "clients" DROP COLUMN IF EXISTS "contact_name";
ALTER TABLE "clients" DROP COLUMN IF EXISTS "email";
ALTER TABLE "clients" DROP COLUMN IF EXISTS "phone_whatsapp";

-- ═════════════════════════════════════════════════════════════════════════
-- POST-MIGRATION VERIFICATION (run manually after applying):
-- ═════════════════════════════════════════════════════════════════════════
--
-- 1. Confirm User fields are populated for all linked clients:
--    SELECT u.email, u.phone_whatsapp, u.name
--    FROM users u
--    JOIN clients c ON c.user_id = u.id
--    WHERE u.phone_whatsapp IS NULL OR u.name IS NULL OR u.name = '';
--
--    Expected: 0 rows. If non-zero, the backfill missed someone
--    (likely a client with no linked user — handle those manually).
--
-- 2. Confirm ClientProfile.communicationInfo no longer has personal fields:
--    SELECT COUNT(*) FROM client_profile
--    WHERE communication_info ? 'contactName'
--       OR communication_info ? 'email'
--       OR communication_info ? 'contactNumber';
--
--    Expected: 0.
--
-- 3. Confirm Client columns are dropped:
--    SELECT column_name FROM information_schema.columns
--    WHERE table_name = 'clients'
--      AND column_name IN ('contact_name', 'email', 'phone_whatsapp');
--
--    Expected: 0 rows.
-- ─────────────────────────────────────────────────────────────────────────