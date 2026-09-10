#!/usr/bin/env bash
set -Eeuo pipefail
umask 077

# Canonical single-host production deployment.
# This script deliberately never resets, pushes, prunes, or restores the database.

ROOT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

ENV_FILE="$ROOT_DIR/.env.production"
COMPOSE_FILE="${COMPOSE_FILE:-$ROOT_DIR/docker-compose.prod.yml}"
BACKUP_DIR="${BACKUP_DIR:-/var/backups/massar}"
LOCK_FILE="${DEPLOY_LOCK_FILE:-/var/lock/massar-deploy.lock}"
HEALTH_TIMEOUT_SECONDS="${HEALTH_TIMEOUT_SECONDS:-180}"

log() { printf '\n==> %s\n' "$*"; }
fatal() { printf '\nERROR: %s\n' "$*" >&2; exit 1; }

tmp_backup=""
cleanup() {
  [[ -z "$tmp_backup" ]] || rm -f -- "$tmp_backup"
}
trap cleanup EXIT

command -v docker >/dev/null 2>&1 || fatal "Docker is required."
command -v flock >/dev/null 2>&1 || fatal "flock is required for deployment locking."
docker compose version >/dev/null 2>&1 || fatal "Docker Compose v2 is required."
[[ -f "$ENV_FILE" ]] || fatal "Missing production environment file: $ENV_FILE"
[[ -f "$COMPOSE_FILE" ]] || fatal "Missing Compose file: $COMPOSE_FILE"

mkdir -p "$(dirname -- "$LOCK_FILE")" "$BACKUP_DIR"
chmod 700 "$BACKUP_DIR"
exec 9>"$LOCK_FILE"
flock -n 9 || fatal "Another production deployment is already running."

# The deployment host must contain only reviewed, committed changes.
if [[ -n "$(git status --porcelain=v1)" ]]; then
  fatal "Working tree is not clean. Commit or remove all local and untracked changes before deploying."
fi

compose=(docker compose --env-file "$ENV_FILE" -f "$COMPOSE_FILE")
on_error() {
  code=$?
  printf '\nERROR: deployment failed (exit %s). Recent service state:\n' "$code" >&2
  "${compose[@]}" ps >&2 || true
  for service in postgres api web nginx; do
    printf '\n--- %s logs ---\n' "$service" >&2
    "${compose[@]}" logs --tail=80 "$service" >&2 || true
  done
  exit "$code"
}
trap on_error ERR

log "Pulling the reviewed branch"
git pull --ff-only

log "Validating Compose configuration"
"${compose[@]}" config -q

# The HTTPS Compose file mounts certificates unconditionally. Fail clearly rather
# than allowing an IP-only deployment to fail later during container startup.
domain="$(awk -F= '/^[[:space:]]*DOMAIN[[:space:]]*=/{sub(/[[:space:]]*#.*/, "", $2); gsub(/[[:space:]\047\"]/, "", $2); print $2; exit}' "$ENV_FILE")"
volume_name="$(awk -F= '/^[[:space:]]*POSTGRES_VOLUME_NAME[[:space:]]*=/{sub(/[[:space:]]*#.*/, "", $2); gsub(/[[:space:]\047\"]/, "", $2); print $2; exit}' "$ENV_FILE")"
[[ -n "$domain" ]] || fatal "DOMAIN must be set for production HTTPS deployment. IP-only mode is not supported by this Compose file."
[[ -n "$volume_name" ]] || fatal "POSTGRES_VOLUME_NAME is required; refusing to risk a new empty database volume."
docker volume inspect "$volume_name" >/dev/null 2>&1 || fatal "Existing PostgreSQL volume not found: $volume_name"
[[ -r "/etc/letsencrypt/live/$domain/fullchain.pem" ]] || fatal "Missing TLS certificate for $domain"
[[ -r "/etc/letsencrypt/live/$domain/privkey.pem" ]] || fatal "Missing TLS private key for $domain"

log "Starting PostgreSQL"
"${compose[@]}" up -d postgres

postgres_id="$("${compose[@]}" ps -q postgres)"
[[ -n "$postgres_id" ]] || fatal "PostgreSQL container was not created."

log "Waiting for PostgreSQL health"
for ((i = 0; i < HEALTH_TIMEOUT_SECONDS; i++)); do
  status="$(docker inspect --format '{{.State.Health.Status}}' "$postgres_id" 2>/dev/null || true)"
  [[ "$status" == "healthy" ]] && break
  [[ "$status" == "unhealthy" ]] && fatal "PostgreSQL is unhealthy."
  sleep 1
done
[[ "$(docker inspect --format '{{.State.Health.Status}}' "$postgres_id")" == "healthy" ]] || fatal "Timed out waiting for PostgreSQL."

log "Creating and verifying database backup"
timestamp="$(date -u +%Y%m%dT%H%M%SZ)"
tmp_backup="$(mktemp "$BACKUP_DIR/.massar-${timestamp}.XXXXXX.sql.gz")"
backup="$BACKUP_DIR/massar-${timestamp}.sql.gz"
"${compose[@]}" exec -T postgres sh -c 'pg_dump -U "$POSTGRES_USER" -d "$POSTGRES_DB"' | gzip >"$tmp_backup"
[[ -s "$tmp_backup" ]] || fatal "Database backup is empty."
gzip -t "$tmp_backup" || fatal "Database backup failed gzip integrity verification."
chmod 600 "$tmp_backup"
mv -- "$tmp_backup" "$backup"
tmp_backup=""
log "Verified backup: $backup"

log "Building API and Web images"
"${compose[@]}" build api web

log "Checking known migration preconditions"
"${compose[@]}" exec -T postgres sh -c 'psql -v ON_ERROR_STOP=1 -U "$POSTGRES_USER" -d "$POSTGRES_DB"' <<'SQL'
DO $$
BEGIN
  IF to_regclass('public.conversation_participants') IS NOT NULL THEN
    IF EXISTS (
      SELECT 1
      FROM "conversation_participants"
      GROUP BY "conversation_id", "user_id"
      HAVING COUNT(*) > 1
    ) THEN
      RAISE EXCEPTION 'CHAT_PARTICIPANT_DUPLICATES_REQUIRE_REVIEW';
    END IF;

    IF EXISTS (
      SELECT 1
      FROM "conversation_participants" cp
      LEFT JOIN "conversations" c ON c."id" = cp."conversation_id"
      WHERE c."id" IS NULL
    ) THEN
      RAISE EXCEPTION 'CHAT_PARTICIPANT_ORPHANS_REQUIRE_REVIEW';
    END IF;
  END IF;

  IF to_regclass('public.campaigns') IS NOT NULL THEN
    IF EXISTS (SELECT 1 FROM "campaigns" WHERE "task_id" IS NULL) THEN
      RAISE EXCEPTION 'CAMPAIGN_TASK_ID_NULLS_REQUIRE_REVIEW';
    END IF;
  END IF;

  IF to_regclass('public.report_snapshots') IS NOT NULL THEN
    IF EXISTS (
      SELECT 1
      FROM "report_snapshots"
      GROUP BY "report_type", "period", "period_start"
      HAVING COUNT(*) > 1
    ) THEN
      RAISE EXCEPTION 'REPORT_SNAPSHOT_DUPLICATES_REQUIRE_REVIEW';
    END IF;
  END IF;
END
$$;
SQL

log "Applying pending Prisma migrations"
"${compose[@]}" run --rm --no-deps --entrypoint npx api prisma migrate deploy

log "Replacing application containers"
"${compose[@]}" up -d --no-build --force-recreate api web nginx

wait_for_health() {
  service="$1"
  id="$("${compose[@]}" ps -q "$service")"
  [[ -n "$id" ]] || fatal "$service container was not created."
  for ((i = 0; i < HEALTH_TIMEOUT_SECONDS; i++)); do
    status="$(docker inspect --format '{{.State.Health.Status}}' "$id" 2>/dev/null || true)"
    [[ "$status" == "healthy" ]] && return 0
    [[ "$status" == "unhealthy" ]] && fatal "$service is unhealthy."
    sleep 1
  done
  fatal "Timed out waiting for $service."
}

log "Waiting for API and Web health checks"
wait_for_health api
wait_for_health web

log "Validating Nginx configuration"
"${compose[@]}" exec -T nginx nginx -t >/dev/null

log "Deployment completed successfully"
"${compose[@]}" ps
