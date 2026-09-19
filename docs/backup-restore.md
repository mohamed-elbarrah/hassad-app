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

## Runtime requirements

- The API image must contain `pg_dump` (`postgresql-client` is installed by the API Dockerfile).
- Cloudflare R2 must be configured and reachable.
- Backups are retained for 30 days by the current policy.
- Do not store backup credentials in the frontend or commit environment files.

## Restore safety

Destructive restore execution is intentionally not enabled by the first phase. A production restore requires maintenance-mode coordination across all API replicas, a pre-restore backup, checksum verification, and an isolated restore/cutover procedure. Until that workflow is deployed and tested, use the downloaded backup with the approved operational restore runbook rather than adding a destructive restore button to the Admin UI.
