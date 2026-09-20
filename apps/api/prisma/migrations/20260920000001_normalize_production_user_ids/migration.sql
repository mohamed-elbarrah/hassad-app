-- Normalize legacy non-UUID users (for example user-sales-default) to UUIDs.
-- Foreign-key columns are updated before users.id so referential integrity remains valid.
-- Run only against a backed-up database; existing sessions/tokens may need renewal.

CREATE TEMP TABLE user_id_map (
  old_id TEXT PRIMARY KEY,
  new_id TEXT UNIQUE NOT NULL
) ON COMMIT DROP;

INSERT INTO user_id_map (old_id, new_id)
SELECT id, gen_random_uuid()::text
FROM "users"
WHERE id !~ '^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$';

-- Save the affected FK definitions and defer them while both sides of each
-- relationship are being renamed. PostgreSQL otherwise rejects the child-row
-- update because the new parent ID does not exist until the parent is updated.
CREATE TEMP TABLE user_fk_defs AS
SELECT
  ns.nspname AS schema_name,
  tbl.relname AS table_name,
  fk.conname AS constraint_name,
  regexp_replace(pg_get_constraintdef(fk.oid), '\\s+DEFERRABLE.*$', '') AS definition,
  col.attname AS column_name
FROM pg_constraint fk
JOIN pg_class tbl ON tbl.oid = fk.conrelid
JOIN pg_namespace ns ON ns.oid = tbl.relnamespace
JOIN pg_attribute col
  ON col.attrelid = fk.conrelid
 AND col.attnum = fk.conkey[1]
WHERE fk.contype = 'f'
  AND fk.confrelid = 'public.users'::regclass
  AND fk.confkey[1] = (
    SELECT attnum
    FROM pg_attribute
    WHERE attrelid = 'public.users'::regclass
      AND attname = 'id'
  )
  AND array_length(fk.conkey, 1) = 1;

DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN SELECT * FROM user_fk_defs LOOP
    EXECUTE format(
      'ALTER TABLE %I.%I DROP CONSTRAINT %I',
      r.schema_name, r.table_name, r.constraint_name
    );
    EXECUTE format(
      'ALTER TABLE %I.%I ADD CONSTRAINT %I %s DEFERRABLE INITIALLY DEFERRED',
      r.schema_name, r.table_name, r.constraint_name, r.definition
    );
  END LOOP;
END $$;

SET CONSTRAINTS ALL DEFERRED;

-- Update every single-column foreign key that references users.id.
DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN SELECT * FROM user_fk_defs LOOP
    EXECUTE format(
      'UPDATE %I.%I AS child
       SET %I = mapping.new_id
       FROM user_id_map AS mapping
       WHERE child.%I = mapping.old_id',
      r.schema_name, r.table_name, r.column_name, r.column_name
    );
  END LOOP;
END $$;

-- Update known polymorphic references as well; these columns are not FKs.
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
SET entity_id = mapping.new_id,
    metadata = CASE
      WHEN event.metadata IS NOT NULL
       AND event.metadata ? 'userId'
      THEN jsonb_set(event.metadata, '{userId}', to_jsonb(mapping.new_id), true)
      ELSE event.metadata
    END
FROM user_id_map AS mapping
WHERE event.entity_type = 'user'
  AND event.entity_id = mapping.old_id;

UPDATE "users" AS user_row
SET id = mapping.new_id
FROM user_id_map AS mapping
WHERE user_row.id = mapping.old_id;

-- Restore the original FK definitions and their original immediacy.
DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN SELECT * FROM user_fk_defs LOOP
    EXECUTE format(
      'ALTER TABLE %I.%I DROP CONSTRAINT %I',
      r.schema_name, r.table_name, r.constraint_name
    );
    EXECUTE format(
      'ALTER TABLE %I.%I ADD CONSTRAINT %I %s',
      r.schema_name, r.table_name, r.constraint_name, r.definition
    );
  END LOOP;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM "users"
    WHERE id !~ '^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$'
  ) THEN
    RAISE EXCEPTION 'USER_ID_NORMALIZATION_INCOMPLETE';
  END IF;
END $$;
