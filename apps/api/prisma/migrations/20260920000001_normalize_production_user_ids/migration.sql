-- Normalize legacy non-UUID users (for example user-sales-default) to UUIDs.
--
-- This migration deliberately does not drop/recreate foreign keys. Every user FK
-- in the schema must have ON UPDATE CASCADE; PostgreSQL then updates the child
-- keys as part of the parent UPDATE while preserving the constraints byte-for-
-- byte (including their action, validation, and deferrability). Dropping an FK
-- after DML is unsafe: PostgreSQL can have pending RI trigger events and rejects
-- the DDL. An unsupported FK is rejected before any data is changed.
BEGIN;

LOCK TABLE "users" IN SHARE ROW EXCLUSIVE MODE;

CREATE TEMP TABLE user_id_map (
  old_id TEXT PRIMARY KEY,
  new_id TEXT UNIQUE NOT NULL
) ON COMMIT DROP;

INSERT INTO user_id_map (old_id, new_id)
SELECT id, gen_random_uuid()::text
FROM "users"
WHERE id !~ '^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$';

-- Refuse composite, non-cascading, or otherwise unsupported references before
-- the first UPDATE. This makes a failed migration safely rollback as a unit.
DO $$
DECLARE
  unsupported RECORD;
BEGIN
  SELECT
    ns.nspname AS schema_name,
    tbl.relname AS table_name,
    con.conname AS constraint_name,
    CASE
      WHEN array_length(con.conkey, 1) <> 1 THEN 'COMPOSITE_USER_FOREIGN_KEY'
      WHEN con.confupdtype <> 'c' THEN 'USER_FOREIGN_KEY_UPDATE_NOT_CASCADE'
      ELSE 'UNSUPPORTED_USER_FOREIGN_KEY'
    END AS reason
  INTO unsupported
  FROM pg_constraint con
  JOIN pg_class tbl ON tbl.oid = con.conrelid
  JOIN pg_namespace ns ON ns.oid = tbl.relnamespace
  WHERE con.contype = 'f'
    AND con.confrelid = 'public.users'::regclass
    AND (
      SELECT attnum
      FROM pg_attribute
      WHERE attrelid = 'public.users'::regclass
        AND attname = 'id'
        AND NOT attisdropped
    ) = ANY (con.confkey)
    AND (
      array_length(con.conkey, 1) <> 1
      OR array_length(con.confkey, 1) <> 1
      OR con.confupdtype <> 'c'
    )
  LIMIT 1;

  IF FOUND THEN
    RAISE EXCEPTION 'USER_ID_NORMALIZATION_UNSUPPORTED_FK: %.%.% (%).',
      unsupported.schema_name, unsupported.table_name,
      unsupported.constraint_name, unsupported.reason;
  END IF;
END $$;

-- Validate any previously deferred checks and use immediate checking for the
-- parent update. No foreign-key definitions or triggers are disabled.
SET CONSTRAINTS ALL IMMEDIATE;

-- ON UPDATE CASCADE updates every supported FK child (including
-- user_departments) atomically with this parent update. No text/blob JSON is
-- searched or rewritten: only documented structured polymorphic references are
-- changed below.
UPDATE "users" AS user_row
SET id = mapping.new_id
FROM user_id_map AS mapping
WHERE user_row.id = mapping.old_id;

-- Known structured, non-FK references to a User. Do not rewrite arbitrary
-- strings in audit payloads or free-form JSON.
UPDATE "client_profile" AS profile
SET created_by = mapping.new_id
FROM user_id_map AS mapping
WHERE profile.created_by = mapping.old_id;
UPDATE "ledger" AS entry
SET entity_id = mapping.new_id
FROM user_id_map AS mapping
WHERE entry.entity = 'user'
  AND entry.entity_id = mapping.old_id;

UPDATE "admin_action_logs" AS action_log
SET target_id = mapping.new_id
FROM user_id_map AS mapping
WHERE action_log.target_type = 'user'
  AND action_log.target_id = mapping.old_id;

UPDATE "notification_events" AS event
SET entity_id = mapping.new_id
FROM user_id_map AS mapping
WHERE event.entity_type = 'user'
  AND event.entity_id = mapping.old_id;

-- A metadata userId is an independent structured reference; its containing
-- event may describe another entity. Only the exact top-level JSON key is
-- changed, never arbitrary text or nested/free-form payloads.
UPDATE "notification_events" AS event
SET metadata = jsonb_set(event.metadata, '{userId}', to_jsonb(mapping.new_id), false)
FROM user_id_map AS mapping
WHERE jsonb_typeof(event.metadata) = 'object'
  AND jsonb_typeof(event.metadata -> 'userId') = 'string'
  AND event.metadata ->> 'userId' = mapping.old_id;

-- Flush all RI checks while the map still exists, and fail the transaction if
-- any legacy ID survived in a known reference.
SET CONSTRAINTS ALL IMMEDIATE;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM "users"
    WHERE id !~ '^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$'
  ) OR EXISTS (
    SELECT 1 FROM "client_profile" WHERE created_by IN (SELECT old_id FROM user_id_map)
  ) OR EXISTS (
    SELECT 1 FROM "ledger" WHERE entity = 'user' AND entity_id IN (SELECT old_id FROM user_id_map)
  ) OR EXISTS (
    SELECT 1 FROM "admin_action_logs" WHERE target_type = 'user' AND target_id IN (SELECT old_id FROM user_id_map)
  ) OR EXISTS (
    SELECT 1 FROM "notification_events"
    WHERE (entity_type = 'user' AND entity_id IN (SELECT old_id FROM user_id_map))
       OR (jsonb_typeof(metadata) = 'object' AND metadata ->> 'userId' IN (SELECT old_id FROM user_id_map))
  ) THEN
    RAISE EXCEPTION 'USER_ID_NORMALIZATION_INCOMPLETE';
  END IF;
END $$;

COMMIT;
