# Backup and restore operations

## Current implementation

- Admin-owned API: `/v1/admin/backups`.
- Daily scheduled full-system backup at 02:00 UTC.
- Manual database-only and full-system backup requests.
- PostgreSQL custom-format dumps are uploaded to private Cloudflare R2 storage.
- Full-system backups copy current R2 application objects into an immutable backup prefix and store a manifest.
- Database dumps use five-minute signed URLs and are recorded in the Admin action log.
- Full-system file artifacts remain in the private R2 backup prefix; a single downloadable archive requires the dedicated archive worker phase.
- Backup operations are persisted and processed asynchronously by the dedicated `backup-worker` container.
- Worker operations use durable leases, fencing, stale-job recovery, and bounded exponential retries.
- The worker image pins the PostgreSQL 17 client to the PostgreSQL 17 production server.
- Admin restore verification is asynchronous and targets only the configured isolated `RESTORE_DATABASE_URL`.

## Runtime requirements

- The API image must contain `pg_dump` (`postgresql-client` is installed by the API Dockerfile).
- Cloudflare R2 must be configured and reachable. Configure the endpoint, bucket, and credentials from Admin → Settings → Integrations; credentials are encrypted in the database and saved Admin settings take precedence over environment fallbacks.
- Backups are retained for 30 days by the current policy.
- Do not store backup credentials in the frontend or commit environment files.

## Restore safety

Destructive production cutover is intentionally not enabled. A production cutover requires maintenance-mode coordination across all API replicas, a pre-restore backup, checksum verification, and a separately tested rollback procedure.

## Admin restore verification

Admins with `admin.backups.restore` can request verification from the Admin backup page for a completed `DATABASE_ONLY` backup. The API queues a `RESTORE` operation and the worker downloads, checksums, creates a unique isolated restore database, runs `pg_restore`, validates the schema and migrations, reports the operation status back to the Admin list, and removes the temporary restore database after verification.

Local Compose uses `hassad_restore` as the base name for unique temporary targets. Temporary targets are marker-protected and cleaned after verification; stale targets are also cleaned by the worker. Production must keep `BACKUP_RESTORE_ENABLED=false` until a separate PostgreSQL 17 restore target is provisioned and tested; never set `RESTORE_DATABASE_URL` equal to `DATABASE_URL`.

## Verified database restore procedure

The repository includes a repeatable, non-destructive local verification command:

```bash
npm run backup:verify-restore:local
```

This local command supplies the safety guards automatically. The lower-level command remains available for controlled environments:

```bash
NODE_ENV=development \
RESTORE_VERIFY_ISOLATED=local \
RESTORE_VERIFY_CONFIRM=I_UNDERSTAND_ISOLATED_RESTORE_ONLY \
npm run backup:verify-restore
```

The command is currently restricted to the allowlisted local PostgreSQL container (`hassad_db`); a separate staging allowlist must be added before staging use. It selects the newest completed `DATABASE_ONLY` backup, verifies the R2 object size and SHA-256 checksum, downloads the PostgreSQL custom-format archive, creates a temporary database in the selected PostgreSQL container, restores it with `pg_restore --exit-on-error --no-owner --no-acl`, validates the restored schema and Prisma migration table, and drops the temporary database in a cleanup block.

Each folder under `backups/` is a backup ID. To verify a specific R2 folder without reading backup metadata from the application database:

```bash
npm run backup:verify-restore:local -- \
  --backup-folder=5ca0ff01-8080-4e36-8fda-7dbb0cb48496
```

The command finds the folder's `database.dump`, computes its size and SHA-256 checksum itself, and restores it into the isolated local database. This is the command to use later with a production backup folder while the restore target remains local.

For a production bucket, create a temporary, permission-restricted environment file containing only the production R2 variables (`CLOUDFLARE_R2_BUCKET`, `CLOUDFLARE_R2_ENDPOINT`, `CLOUDFLARE_R2_ACCESS_KEY`, and `CLOUDFLARE_R2_SECRET_KEY`). Do not include `DATABASE_URL` and do not commit the file. Then run:

```bash
BACKUP_ENV_FILE=/secure/production-r2.env \
npm run backup:verify-restore:folder -- \
  --backup-folder=<production-backup-folder-id>
```

The verifier still requires the local `hassad_db` container and cannot connect to or restore over production PostgreSQL.

To verify a specific backup using the local application database metadata:

```bash
NODE_ENV=development \
RESTORE_VERIFY_ISOLATED=local \
RESTORE_VERIFY_CONFIRM=I_UNDERSTAND_ISOLATED_RESTORE_ONLY \
BACKUP_ID=<backup-id> POSTGRES_CONTAINER=hassad_db POSTGRES_USER=hassad \
npm run backup:verify-restore
```

This procedure must run against a local or isolated PostgreSQL instance, never the production application database. The explicit confirmation and production/container guards are intentional. The command creates and drops only its uniquely named temporary verification database; it does not replace, drop, or modify the live application database.

## Version and vendor references

The application and local/production Compose files use PostgreSQL 17. The API/worker image installs the PostgreSQL 17 client, so `pg_dump` and `pg_restore` remain aligned with the server major version.

The backup format follows PostgreSQL 17 documentation: `pg_dump -Fc` creates a custom archive and `pg_restore` restores that archive. Compose waits for PostgreSQL health before starting the worker using the documented `service_healthy` dependency condition.

Cloudflare R2 uses the S3-compatible endpoint `https://<ACCOUNT_ID>.r2.cloudflarestorage.com`; the endpoint must be configured explicitly. The unverified third-party images previously suggested for this feature are not used.

Official references:

- PostgreSQL 17 `pg_dump`: https://www.postgresql.org/docs/17/app-pgdump.html
- PostgreSQL 17 SQL dump and restore: https://www.postgresql.org/docs/17/backup-dump.html
- Docker Compose startup order: https://docs.docker.com/compose/how-tos/startup-order/
- Cloudflare R2 S3 API compatibility: https://developers.cloudflare.com/r2/api/s3/api/
