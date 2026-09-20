# Recover the failed production user UUID migration

The production bootstrap previously generated `user-<name>-default` IDs. It now generates UUIDs for new users and department memberships. Existing accounts are preserved by email. Do not rerun bootstrap to repair existing IDs or reset production data.

The replacement migration uses one explicit transaction and PostgreSQL `ON UPDATE CASCADE`. It does not drop constraints or disable triggers. Existing UUID users remain unchanged. Known non-FK operational references are updated; historical/free-form audit snapshots are intentionally retained as historical data.

## Before retrying

- Commit/push the corrected migration, bootstrap script and test, then pull on the server.
- Retain the backup from before the first failed deployment. Verify recovery using a restored copy before running against production. The deploy script's gzip integrity check is not a restore test.
- Inspect production state: `migrate resolve --rolled-back` only changes migration history; it does not undo database changes. Do not assume a prior failed migration rolled back solely from that command.
- Run this read-only query from the repository directory. Verify user IDs and FK definitions against the pre-failure backup. All user-ID FKs must be single-column and `ON UPDATE CASCADE`; the new migration refuses unsupported constraints before updates.

```bash
docker compose --env-file .env.production -f docker-compose.prod.yml exec -T postgres sh -c 'psql -U "$POSTGRES_USER" -d "$POSTGRES_DB"' <<'SQL'
SELECT id FROM users ORDER BY id;
SELECT conrelid::regclass AS child_table, conname, pg_get_constraintdef(oid) AS definition FROM pg_constraint WHERE contype = 'f' AND confrelid = 'public.users'::regclass ORDER BY 1, 2;
SELECT migration_name, started_at, finished_at, rolled_back_at FROM _prisma_migrations WHERE migration_name = '20260920000001_normalize_production_user_ids' ORDER BY started_at;
SQL
```

## Controlled retry (downtime required)

Stop all application writers, including any external workers connected to this database. For this Compose stack:

```bash
docker compose --env-file .env.production -f docker-compose.prod.yml stop nginx web api backup-worker
```

After confirming the prior failure left no partial changes, clear the failed record (never use `--applied` for this failed migration):

```bash
docker compose --env-file .env.production -f docker-compose.prod.yml run --rm --no-deps --entrypoint npx api prisma migrate resolve --rolled-back 20260920000001_normalize_production_user_ids --schema=apps/api/prisma/schema.prisma
```

Deploy the committed correction; this backs up, builds, applies migrations and restarts the stack:

```bash
sudo ./scripts/deploy-production.sh
```

If deployment fails, stop and inspect the specific error. Do not repeatedly resolve/retry or restore an old backup over newer production writes.

After success, verify no non-UUID users remain and log in again. Tokens containing the old IDs cannot be rewritten by a database migration. This does not create user accounts for old unlinked client records.

## Local verification

```bash
bash apps/api/prisma/tests/normalize-production-user-ids.sh
```

Uses disposable databases in local `hassad_db`, including a read-only schema dump of the application database. Tests real legacy ID updates, linked records, no-op reruns, failure rollback, and actual bootstrap SQL twice. It never modifies the application database. It is a focused database test, not E2E or production verification.
