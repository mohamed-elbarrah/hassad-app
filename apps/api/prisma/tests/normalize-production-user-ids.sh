#!/usr/bin/env bash
# Reproducible disposable-PostgreSQL test for the migration under test.
# Uses the local hassad_db container credentials and a disposable fixture database.
# Never changes the normal application database. Requires Docker.
set -Eeuo pipefail

psql() {
  docker exec -i -e PGDATABASE="${PGDATABASE:-postgres}" hassad_db \
    sh -c 'exec psql -U "$POSTGRES_USER" "$@"' sh "$@"
}

root_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")/../../../.." && pwd)"
migrations_dir="$root_dir/apps/api/prisma/migrations"
target="20260920000001_normalize_production_user_ids"
db="hassad_user_id_migration_test_${RANDOM}_$$"
full_db="hassad_production_bootstrap_test_${RANDOM}_$$"
db_created=0
full_db_created=0
tmp_dir="$(mktemp -d)"
cleanup() {
  (( db_created )) && psql -X -d postgres -v ON_ERROR_STOP=0 -c "DROP DATABASE IF EXISTS \"$db\" WITH (FORCE)" >/dev/null 2>&1 || true
  (( full_db_created )) && psql -X -d postgres -v ON_ERROR_STOP=0 -c "DROP DATABASE IF EXISTS \"$full_db\" WITH (FORCE)" >/dev/null 2>&1 || true
  rm -rf "$tmp_dir"
}
trap cleanup EXIT

# Create an isolated database. The focused fixture mirrors the pre-migration
# tables and constraints used by this migration; it avoids unrelated historical
# migrations that are not independently replayable in this repository.
for candidate in "$db" "$full_db"; do
  if psql -X -d postgres -Atc "SELECT 1 FROM pg_database WHERE datname = '$candidate'" | grep -q '^1$'; then
    echo "refusing to use existing database: $candidate" >&2
    exit 1
  fi
done
psql -X -d postgres -v ON_ERROR_STOP=1 -c "CREATE DATABASE \"$db\"" >/dev/null
db_created=1
export PGDATABASE="$db"
psql -X -v ON_ERROR_STOP=1 <<'SQL'
CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE TABLE roles (id text PRIMARY KEY, name text UNIQUE NOT NULL);
CREATE TABLE users (id text PRIMARY KEY, name text NOT NULL, email text UNIQUE NOT NULL, role_id text NOT NULL REFERENCES roles(id));
CREATE TABLE departments (id text PRIMARY KEY, name text UNIQUE NOT NULL);
CREATE TABLE user_departments (id text PRIMARY KEY, user_id text NOT NULL REFERENCES users(id) ON DELETE CASCADE ON UPDATE CASCADE, department_id text NOT NULL REFERENCES departments(id) ON DELETE CASCADE);
CREATE TABLE ledger (id text PRIMARY KEY, action text NOT NULL, entity text NOT NULL, entity_id text NOT NULL, user_id text REFERENCES users(id) ON UPDATE CASCADE, metadata jsonb);
CREATE TABLE admin_action_logs (id text PRIMARY KEY, actor_id text NOT NULL REFERENCES users(id) ON UPDATE CASCADE, target_type text NOT NULL, target_id text NOT NULL, action_type text NOT NULL);
CREATE TABLE notification_events (id text PRIMARY KEY, entity_id text NOT NULL, entity_type text NOT NULL, event_type text NOT NULL, metadata jsonb);
CREATE TABLE client_profile (id text PRIMARY KEY, created_by text);
SQL

psql -X -v ON_ERROR_STOP=1 <<'SQL'
INSERT INTO roles (id, name) VALUES ('role-migration-test', 'migration-test');
INSERT INTO departments (id, name) VALUES ('department-migration-test', 'migration-test');
INSERT INTO users (id, name, email, role_id)
VALUES ('user-sales-default', 'Legacy user', 'migration-test@example.test', 'role-migration-test'),
       ('22222222-2222-2222-2222-222222222222', 'Existing UUID', 'uuid-test@example.test', 'role-migration-test');
INSERT INTO client_profile VALUES ('profile-test', 'user-sales-default');
INSERT INTO user_departments (id, user_id, department_id)
VALUES ('33333333-3333-3333-3333-333333333333', 'user-sales-default', 'department-migration-test');
INSERT INTO ledger (id, action, entity, entity_id, user_id)
VALUES ('44444444-4444-4444-4444-444444444444', 'TEST', 'user', 'user-sales-default', NULL);
INSERT INTO admin_action_logs (id, actor_id, target_type, target_id, action_type)
VALUES ('55555555-5555-5555-5555-555555555555', '22222222-2222-2222-2222-222222222222', 'user', 'user-sales-default', 'TEST');
INSERT INTO notification_events (id, entity_id, entity_type, event_type, metadata)
VALUES ('66666666-6666-6666-6666-666666666666', 'user-sales-default', 'user', 'TEST', '{"userId":"user-sales-default","untouched":"user-sales-default"}'),
       ('77777777-7777-7777-7777-777777777777', 'other-entity', 'project', 'TEST', '{"userId":"user-sales-default"}');
SQL

psql -X -v ON_ERROR_STOP=1 < "$migrations_dir/$target/migration.sql" >/dev/null
# Rerun/no-op must succeed and preserve the already-normalized UUID.
psql -X -v ON_ERROR_STOP=1 < "$migrations_dir/$target/migration.sql" >/dev/null
psql -X -v ON_ERROR_STOP=1 <<'SQL'
DO $$
DECLARE normalized_id text;
BEGIN
  SELECT id INTO normalized_id FROM users WHERE email = 'migration-test@example.test';
  IF normalized_id IS NULL OR normalized_id !~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' THEN RAISE EXCEPTION 'legacy user not normalized'; END IF;
  IF NOT EXISTS (SELECT 1 FROM users WHERE email = 'uuid-test@example.test' AND id = '22222222-2222-2222-2222-222222222222') THEN RAISE EXCEPTION 'existing UUID changed'; END IF;
  IF (SELECT created_by FROM client_profile WHERE id = 'profile-test') <> normalized_id THEN RAISE EXCEPTION 'profile attribution missing'; END IF;
  IF (SELECT user_id FROM user_departments WHERE id = '33333333-3333-3333-3333-333333333333') <> normalized_id THEN RAISE EXCEPTION 'FK cascade missing'; END IF;
  IF (SELECT entity_id FROM ledger WHERE id = '44444444-4444-4444-4444-444444444444') <> normalized_id THEN RAISE EXCEPTION 'ledger reference missing'; END IF;
  IF (SELECT target_id FROM admin_action_logs WHERE id = '55555555-5555-5555-5555-555555555555') <> normalized_id THEN RAISE EXCEPTION 'admin reference missing'; END IF;
  IF (SELECT metadata->>'userId' FROM notification_events WHERE id = '66666666-6666-6666-6666-666666666666') <> normalized_id THEN RAISE EXCEPTION 'notification reference missing'; END IF;
  IF (SELECT metadata->>'untouched' FROM notification_events WHERE id = '66666666-6666-6666-6666-666666666666') <> 'user-sales-default' THEN RAISE EXCEPTION 'arbitrary JSON was rewritten'; END IF;
  IF (SELECT metadata->>'userId' FROM notification_events WHERE id = '77777777-7777-7777-7777-777777777777') <> normalized_id THEN RAISE EXCEPTION 'independent metadata reference missing'; END IF;
END $$;
SQL

# Unsupported-FK failure must roll back all data changes. This table is test-only.
psql -X -v ON_ERROR_STOP=1 <<'SQL'
CREATE TABLE unsupported_user_refs (id text PRIMARY KEY, user_id text NOT NULL);
ALTER TABLE unsupported_user_refs ADD CONSTRAINT unsupported_user_refs_user_fkey
  FOREIGN KEY (user_id) REFERENCES users(id) ON UPDATE NO ACTION;
INSERT INTO users (id, name, email, role_id)
VALUES ('legacy-rollback-user', 'Rollback user', 'rollback@example.test', 'role-migration-test');
INSERT INTO unsupported_user_refs VALUES ('rollback-ref', 'legacy-rollback-user');
SQL
if psql -X -v ON_ERROR_STOP=1 < "$migrations_dir/$target/migration.sql" >/dev/null 2>&1; then
  echo 'expected unsupported FK migration failure' >&2
  exit 1
fi
psql -X -v ON_ERROR_STOP=1 <<'SQL'
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM users WHERE id = 'legacy-rollback-user')
     OR NOT EXISTS (SELECT 1 FROM unsupported_user_refs WHERE user_id = 'legacy-rollback-user') THEN
    RAISE EXCEPTION 'failed migration changed data';
  END IF;
END $$;
SQL

echo "PASS: $db (isolated disposable database; success, FK cascade, non-FK references, no-op, and rollback verified)"

# Rebuild a second disposable database from the real local application's schema.
# pg_dump is read-only against the source database; all writes below target only
# this throwaway database and it is forcibly dropped by cleanup().
source_db="${SOURCE_DB:-$(docker exec hassad_db sh -c 'printf %s "$POSTGRES_DB"')}"
[[ -n "$source_db" && "$source_db" != "$db" && "$source_db" != "$full_db" ]] || {
  echo 'source database must be a non-disposable application database' >&2
  exit 1
}
bootstrap_sql="$tmp_dir/bootstrap.sql"
schema_dump="$tmp_dir/schema.sql"
awk '
  /postgres sh -c '\''psql -v ON_ERROR_STOP=1/ && /<<'\''SQL'\''/ { capture=1; next }
  capture && /^SQL$/ { exit }
  capture { print }
' "$root_dir/scripts/bootstrap-production-access.sh" > "$bootstrap_sql"
[[ -s "$bootstrap_sql" ]] || { echo 'failed to extract production bootstrap SQL' >&2; exit 1; }

docker exec hassad_db pg_dump -U "$(docker exec hassad_db sh -c 'printf %s "$POSTGRES_USER"')" \
  -d "$source_db" --schema-only --no-owner --no-privileges > "$schema_dump"
psql -X -d postgres -v ON_ERROR_STOP=1 -c "CREATE DATABASE \"$full_db\"" >/dev/null
full_db_created=1
export PGDATABASE="$full_db"
psql -X -v ON_ERROR_STOP=1 < "$schema_dump" >/dev/null

# Keep one pre-existing account (including its ID and password) and let the
# extracted production SQL create the remaining accounts with a safe test hash.
psql -X -v ON_ERROR_STOP=1 <<'SQL'
INSERT INTO roles (id, name) VALUES ('existing-role', 'ADMIN') ON CONFLICT (name) DO NOTHING;
INSERT INTO users (id, name, email, password_hash, role_id, created_at, updated_at)
SELECT 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Pre-existing admin', 'admin@test.invalid', 'existing-password-hash', id, now(), now()
FROM roles WHERE name = 'ADMIN'
ON CONFLICT (email) DO NOTHING;
SQL

dummy_hash='$2b$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy'
psql -X -v ON_ERROR_STOP=1 -v password_hash="$dummy_hash" -v email_domain='test.invalid' < "$bootstrap_sql" >/dev/null
# The bootstrap must be idempotent, including its generated UUIDs and memberships.
psql -X -v ON_ERROR_STOP=1 -v password_hash="$dummy_hash" -v email_domain='test.invalid' < "$bootstrap_sql" >/dev/null
psql -X -v ON_ERROR_STOP=1 <<'SQL'
DO $$
DECLARE email_name text;
BEGIN
  IF (SELECT id FROM users WHERE email = 'admin@test.invalid') <> 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'
     OR (SELECT password_hash FROM users WHERE email = 'admin@test.invalid') <> 'existing-password-hash' THEN
    RAISE EXCEPTION 'pre-existing user was changed';
  END IF;
  FOREACH email_name IN ARRAY ARRAY[
    'admin@test.invalid', 'sales@test.invalid', 'pm@test.invalid',
    'designer@test.invalid', 'dev@test.invalid', 'content@test.invalid',
    'marketing@test.invalid', 'finance@test.invalid'
  ] LOOP
    IF NOT EXISTS (SELECT 1 FROM users WHERE email = email_name
                   AND email LIKE '%@test.invalid'
                   AND id ~ '^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$') THEN
      RAISE EXCEPTION 'bootstrap user is missing, has the wrong domain, or is not UUID: %', email_name;
    END IF;
    IF email_name <> 'admin@test.invalid'
       AND (SELECT password_hash FROM users WHERE email = email_name) <> '$2b$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy' THEN
      RAISE EXCEPTION 'bootstrap user has the wrong password hash: %', email_name;
    END IF;
  END LOOP;
  IF (SELECT count(*) FROM users WHERE email LIKE '%@test.invalid') <> 8 THEN
    RAISE EXCEPTION 'bootstrap created an unexpected number of users';
  END IF;
  IF (SELECT count(*) FROM user_departments ud JOIN users u ON u.id = ud.user_id
      WHERE u.email IN ('pm@test.invalid', 'designer@test.invalid', 'dev@test.invalid', 'content@test.invalid', 'marketing@test.invalid')) <> 5 THEN
    RAISE EXCEPTION 'bootstrap department memberships are incomplete or duplicated';
  END IF;
END $$;
SQL

# Exercise the normalization migration against that same full schema, with a
# legacy explicit ID and real user-dependent rows (including user_departments).
psql -X -v ON_ERROR_STOP=1 <<'SQL'
INSERT INTO users (id, name, email, password_hash, role_id, created_at, updated_at)
SELECT 'legacy-full-schema-user', 'Legacy full-schema user', 'legacy-full-schema@test.invalid', 'legacy-hash', id, now(), now()
FROM roles WHERE name = 'SALES';
INSERT INTO user_departments (id, user_id, department_id)
SELECT 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'legacy-full-schema-user', id
FROM departments WHERE name = 'MANAGEMENT';
INSERT INTO clients (id, company_name, business_name, business_type, status, user_id, created_at, updated_at)
VALUES ('cccccccc-cccc-cccc-cccc-cccccccccccc', 'Legacy Co', 'Legacy Co', 'OTHER', 'ACTIVE', 'legacy-full-schema-user', now(), now());
INSERT INTO client_profile (id, client_id, created_by, created_at, updated_at)
VALUES ('dddddddd-dddd-dddd-dddd-dddddddddddd', 'cccccccc-cccc-cccc-cccc-cccccccccccc', 'legacy-full-schema-user', now(), now());
INSERT INTO ledger (id, action, entity, entity_id)
VALUES ('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', 'TEST', 'user', 'legacy-full-schema-user');
INSERT INTO admin_action_logs (id, actor_id, target_type, target_id, action_type)
VALUES ('ffffffff-ffff-ffff-ffff-ffffffffffff', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'user', 'legacy-full-schema-user', 'TEST');
INSERT INTO notification_events (id, entity_id, entity_type, event_type, metadata)
VALUES ('11111111-1111-1111-1111-111111111111', 'legacy-full-schema-user', 'user', 'TEST', '{"userId":"legacy-full-schema-user"}');
SQL
psql -X -v ON_ERROR_STOP=1 < "$migrations_dir/$target/migration.sql" >/dev/null
psql -X -v ON_ERROR_STOP=1 < "$migrations_dir/$target/migration.sql" >/dev/null
psql -X -v ON_ERROR_STOP=1 <<'SQL'
DO $$
DECLARE normalized_id text;
BEGIN
  SELECT id INTO normalized_id FROM users WHERE email = 'legacy-full-schema@test.invalid';
  IF normalized_id IS NULL OR normalized_id !~ '^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$' THEN RAISE EXCEPTION 'full-schema legacy user was not normalized'; END IF;
  IF EXISTS (SELECT 1 FROM users WHERE id = 'legacy-full-schema-user') THEN RAISE EXCEPTION 'legacy ID survived'; END IF;
  IF (SELECT id FROM users WHERE email = 'admin@test.invalid') <> 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa' THEN RAISE EXCEPTION 'existing UUID changed'; END IF;
  IF (SELECT user_id FROM user_departments WHERE id = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb') <> normalized_id THEN RAISE EXCEPTION 'full-schema department FK missing'; END IF;
  IF (SELECT created_by FROM client_profile WHERE id = 'dddddddd-dddd-dddd-dddd-dddddddddddd') <> normalized_id THEN RAISE EXCEPTION 'full-schema profile attribution missing'; END IF;
  IF (SELECT user_id FROM clients WHERE id = 'cccccccc-cccc-cccc-cccc-cccccccccccc') <> normalized_id THEN RAISE EXCEPTION 'full-schema client FK missing'; END IF;
  IF (SELECT entity_id FROM ledger WHERE id = 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee') <> normalized_id THEN RAISE EXCEPTION 'full-schema ledger reference missing'; END IF;
  IF (SELECT target_id FROM admin_action_logs WHERE id = 'ffffffff-ffff-ffff-ffff-ffffffffffff') <> normalized_id THEN RAISE EXCEPTION 'full-schema admin reference missing'; END IF;
  IF (SELECT metadata->>'userId' FROM notification_events WHERE id = '11111111-1111-1111-1111-111111111111') <> normalized_id THEN RAISE EXCEPTION 'full-schema notification reference missing'; END IF;
END $$;
SQL

echo "PASS: production bootstrap extracted/idempotent and migration verified against full disposable schema ($full_db)"
