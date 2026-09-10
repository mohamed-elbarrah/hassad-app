#!/usr/bin/env bash
set -Eeuo pipefail

ROOT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

ENV_FILE="${ENV_FILE:-$ROOT_DIR/.env.production}"
COMPOSE_FILE="${COMPOSE_FILE:-$ROOT_DIR/docker-compose.prod.yml}"
DEFAULT_EMAIL_DOMAIN="${DEFAULT_EMAIL_DOMAIN:-massar.com}"
DEFAULT_PASSWORD="${DEFAULT_PASSWORD:-}"

[[ -n "$DEFAULT_PASSWORD" ]] || { echo "DEFAULT_PASSWORD is required" >&2; exit 1; }
[[ -f "$ENV_FILE" ]] || { echo "Missing env file: $ENV_FILE" >&2; exit 1; }
[[ -f "$COMPOSE_FILE" ]] || { echo "Missing compose file: $COMPOSE_FILE" >&2; exit 1; }
command -v docker >/dev/null 2>&1 || { echo "Docker is required" >&2; exit 1; }

compose=(docker compose --env-file "$ENV_FILE" -f "$COMPOSE_FILE")

# Ensure postgres is available. This does not recreate data volumes.
"${compose[@]}" up -d postgres >/dev/null

# Use the API image/container for bcrypt so password hashing matches the app.
if docker ps --format '{{.Names}}' | grep -qx 'hassad-api'; then
  PASSWORD_HASH="$(docker exec hassad-api node -e "require('bcrypt').hash(process.argv[1],10).then(console.log)" "$DEFAULT_PASSWORD")"
else
  PASSWORD_HASH="$("${compose[@]}" run --rm --no-deps --entrypoint node api -e "require('bcrypt').hash(process.argv[1],10).then(console.log)" "$DEFAULT_PASSWORD")"
fi

"${compose[@]}" exec -T \
  -e PASSWORD_HASH="$PASSWORD_HASH" \
  -e DEFAULT_EMAIL_DOMAIN="$DEFAULT_EMAIL_DOMAIN" \
  postgres sh -c 'psql -v ON_ERROR_STOP=1 -U "$POSTGRES_USER" -d "$POSTGRES_DB" -v password_hash="$PASSWORD_HASH" -v email_domain="$DEFAULT_EMAIL_DOMAIN"' <<'SQL'
BEGIN;

-- Canonical roles used by the application.
INSERT INTO roles (id, name) VALUES
  ('role-admin', 'ADMIN'),
  ('role-pm', 'PM'),
  ('role-sales', 'SALES'),
  ('role-team', 'TEAM'),
  ('role-marketing', 'MARKETING'),
  ('role-accountant', 'ACCOUNTANT'),
  ('role-client', 'CLIENT')
ON CONFLICT (name) DO NOTHING;

-- Canonical departments used by team/PM assignment flows.
INSERT INTO departments (id, name, created_at) VALUES
  ('dept-management', 'MANAGEMENT', now()),
  ('dept-design', 'DESIGN', now()),
  ('dept-development', 'DEVELOPMENT', now()),
  ('dept-content', 'CONTENT', now()),
  ('dept-marketing', 'MARKETING', now()),
  ('dept-production', 'PRODUCTION', now())
ON CONFLICT (name) DO NOTHING;

-- Permission catalog = local seed catalog plus every @RequirePermissions code currently used by API controllers.
WITH permission_names(name) AS (VALUES
  ('admin.ai.manage'),
  ('admin.ai.read'),
  ('admin.alerts'),
  ('admin.audit'),
  ('admin.business_goals.create'),
  ('admin.business_goals.delete'),
  ('admin.business_goals.read'),
  ('admin.business_goals.update'),
  ('admin.campaigns.create'),
  ('admin.campaigns.intervene'),
  ('admin.campaigns.read'),
  ('admin.chat.moderate'),
  ('admin.chat.read'),
  ('admin.clients.intervene'),
  ('admin.clients.read'),
  ('admin.contracts.intervene'),
  ('admin.contracts.read'),
  ('admin.dashboard'),
  ('admin.finance.intervene'),
  ('admin.finance.read'),
  ('admin.funnel'),
  ('admin.marketing'),
  ('admin.notifications'),
  ('admin.portal'),
  ('admin.portal.manage'),
  ('admin.portal.read'),
  ('admin.projects'),
  ('admin.projects.create'),
  ('admin.projects.intervene'),
  ('admin.projects.read'),
  ('admin.proposals.intervene'),
  ('admin.proposals.read'),
  ('admin.reports'),
  ('admin.requests.intervene'),
  ('admin.requests.read'),
  ('admin.security.read'),
  ('admin.sessions.read'),
  ('admin.settings'),
  ('admin.stats'),
  ('admin.stats.trends'),
  ('admin.tasks.intervene'),
  ('admin.tasks.read'),
  ('admin.team'),
  ('admin.users.impersonate'),
  ('admin.users.manage'),
  ('admin.users.read'),
  ('ai.analyze'),
  ('ai.manage_suggestions'),
  ('ai.read'),
  ('automation.create'),
  ('automation.execute'),
  ('automation.read'),
  ('chat.create'),
  ('chat.message'),
  ('chat.read'),
  ('chat.update'),
  ('clients.create'),
  ('clients.handover'),
  ('clients.read'),
  ('clients.read_activity'),
  ('clients.update'),
  ('contracts.activate'),
  ('contracts.cancel'),
  ('contracts.create'),
  ('contracts.manage_payment_plan'),
  ('contracts.manage_versions'),
  ('contracts.read'),
  ('contracts.read_public'),
  ('contracts.send'),
  ('contracts.sign'),
  ('contracts.sign_public'),
  ('contracts.update'),
  ('departments.assign'),
  ('departments.create'),
  ('departments.read'),
  ('disputes.admin'),
  ('disputes.create'),
  ('disputes.pm_read'),
  ('disputes.pm_update'),
  ('disputes.read'),
  ('finance.admin'),
  ('finance.create_invoice'),
  ('finance.manage_payroll'),
  ('finance.manage_tickets'),
  ('finance.read'),
  ('finance.read_ledger'),
  ('finance.update_invoice'),
  ('invoices.pay_public'),
  ('marketing.create'),
  ('marketing.delete'),
  ('marketing.flag_optimization'),
  ('marketing.manage_kpis'),
  ('marketing.manage_tests'),
  ('marketing.read'),
  ('marketing.update'),
  ('notification-templates.read'),
  ('notification-templates.update'),
  ('notifications.broadcast'),
  ('notifications.read'),
  ('notifications.update'),
  ('permissions.read'),
  ('portal.approve_deliverables'),
  ('portal.manage_deliverables'),
  ('portal.manage_intake'),
  ('portal.read'),
  ('portal.request_revisions'),
  ('projects.archive'),
  ('projects.create'),
  ('projects.manage_members'),
  ('projects.read'),
  ('projects.update'),
  ('proposals.approve'),
  ('proposals.create'),
  ('proposals.read'),
  ('proposals.read_public'),
  ('proposals.reject'),
  ('proposals.send'),
  ('proposals.update'),
  ('requests.assign'),
  ('requests.convert'),
  ('requests.create'),
  ('requests.delete'),
  ('requests.read'),
  ('requests.update'),
  ('roles.assign_permissions'),
  ('roles.create'),
  ('roles.read'),
  ('roles.update'),
  ('sales.read'),
  ('services.create'),
  ('services.delete'),
  ('services.read'),
  ('services.update'),
  ('tasks.approve'),
  ('tasks.assign'),
  ('tasks.comment'),
  ('tasks.create'),
  ('tasks.delete'),
  ('tasks.read'),
  ('tasks.update'),
  ('users.create'),
  ('users.delete'),
  ('users.read'),
  ('users.update')
)
INSERT INTO permissions (id, name)
SELECT 'perm-' || replace(replace(name, '.', '-'), '_', '-'), name FROM permission_names
ON CONFLICT (name) DO NOTHING;

-- ADMIN does not need role_permission rows for API authorization because
-- PermissionsGuard authorizes ADMIN through the role bypass. Admin UI permission
-- presentation is served by /auth/me and does not require permissions in JWTs.

-- Least-privilege baseline based on the local seed mapping, plus missing controller permissions for each portal.
WITH map(role_name, permission_name) AS (VALUES
  -- PM
  ('PM','projects.create'),('PM','projects.read'),('PM','projects.update'),('PM','projects.manage_members'),
  ('PM','tasks.read'),('PM','tasks.create'),('PM','tasks.assign'),('PM','tasks.update'),('PM','tasks.approve'),('PM','tasks.comment'),
  ('PM','proposals.read'),('PM','proposals.update'),('PM','proposals.approve'),('PM','proposals.reject'),
  ('PM','notifications.read'),('PM','notifications.update'),('PM','finance.read'),('PM','finance.update_invoice'),
  ('PM','marketing.read'),('PM','portal.read'),('PM','services.read'),('PM','chat.create'),('PM','chat.read'),('PM','chat.message'),
  ('PM','clients.read'),('PM','disputes.pm_read'),('PM','disputes.pm_update'),

  -- Sales / CRM
  ('SALES','sales.read'),('SALES','requests.create'),('SALES','requests.read'),('SALES','requests.update'),('SALES','requests.assign'),('SALES','requests.convert'),
  ('SALES','proposals.create'),('SALES','proposals.read'),('SALES','proposals.update'),('SALES','proposals.send'),('SALES','proposals.read_public'),
  ('SALES','contracts.create'),('SALES','contracts.read'),('SALES','contracts.update'),('SALES','contracts.send'),('SALES','contracts.sign'),('SALES','contracts.activate'),('SALES','contracts.cancel'),('SALES','contracts.manage_versions'),('SALES','contracts.manage_payment_plan'),
  ('SALES','notifications.read'),('SALES','notifications.update'),('SALES','services.read'),('SALES','chat.create'),('SALES','chat.read'),('SALES','chat.message'),
  ('SALES','clients.read'),('SALES','clients.create'),('SALES','clients.update'),('SALES','clients.read_activity'),('SALES','finance.read'),

  -- Team
  ('TEAM','tasks.read'),('TEAM','tasks.update'),('TEAM','tasks.comment'),('TEAM','projects.read'),
  ('TEAM','notifications.read'),('TEAM','notifications.update'),('TEAM','chat.read'),('TEAM','chat.message'),

  -- Marketing
  ('MARKETING','marketing.create'),('MARKETING','marketing.read'),('MARKETING','marketing.update'),('MARKETING','marketing.delete'),('MARKETING','marketing.manage_tests'),('MARKETING','marketing.manage_kpis'),('MARKETING','marketing.flag_optimization'),
  ('MARKETING','tasks.read'),('MARKETING','tasks.update'),('MARKETING','tasks.comment'),('MARKETING','notifications.read'),('MARKETING','notifications.update'),('MARKETING','chat.read'),('MARKETING','chat.message'),

  -- Finance / Accountant
  ('ACCOUNTANT','finance.admin'),('ACCOUNTANT','finance.create_invoice'),('ACCOUNTANT','finance.read'),('ACCOUNTANT','finance.update_invoice'),('ACCOUNTANT','finance.manage_tickets'),('ACCOUNTANT','finance.read_ledger'),('ACCOUNTANT','finance.manage_payroll'),
  ('ACCOUNTANT','notifications.read'),('ACCOUNTANT','notifications.update'),('ACCOUNTANT','chat.read'),('ACCOUNTANT','chat.message'),

  -- Client portal baseline
  ('CLIENT','proposals.read_public'),('CLIENT','notifications.read'),('CLIENT','requests.create'),('CLIENT','contracts.read_public'),('CLIENT','contracts.sign_public'),('CLIENT','invoices.pay_public'),
  ('CLIENT','portal.read'),('CLIENT','portal.manage_intake'),('CLIENT','portal.approve_deliverables'),('CLIENT','portal.request_revisions'),('CLIENT','services.read'),('CLIENT','chat.read'),('CLIENT','chat.message')
)
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM map
JOIN roles r ON r.name = map.role_name
JOIN permissions p ON p.name = map.permission_name
ON CONFLICT DO NOTHING;

-- Default internal users. Existing emails are never overwritten; this avoids changing real owners/staff.
WITH defaults(email, full_name, role_name) AS (VALUES
  ('admin@' || :'email_domain', 'Admin', 'ADMIN'),
  ('sales@' || :'email_domain', 'Sales', 'SALES'),
  ('pm@' || :'email_domain', 'PM', 'PM'),
  ('designer@' || :'email_domain', 'Designer', 'TEAM'),
  ('dev@' || :'email_domain', 'Developer', 'TEAM'),
  ('content@' || :'email_domain', 'Content', 'TEAM'),
  ('marketing@' || :'email_domain', 'Marketing', 'MARKETING'),
  ('finance@' || :'email_domain', 'Finance', 'ACCOUNTANT')
)
INSERT INTO users (id, name, email, password_hash, role_id, is_active, provider, created_at, updated_at)
SELECT 'user-' || split_part(email, '@', 1) || '-default', full_name, email, :'password_hash', r.id, true, 'local', now(), now()
FROM defaults d
JOIN roles r ON r.name = d.role_name
ON CONFLICT (email) DO NOTHING;

-- Department membership for default staff users.
WITH memberships(email, dept_name) AS (VALUES
  ('pm@' || :'email_domain', 'MANAGEMENT'),
  ('designer@' || :'email_domain', 'DESIGN'),
  ('dev@' || :'email_domain', 'DEVELOPMENT'),
  ('content@' || :'email_domain', 'CONTENT'),
  ('marketing@' || :'email_domain', 'MARKETING')
)
INSERT INTO user_departments (id, user_id, department_id)
SELECT 'ud-' || u.id || '-' || d.id, u.id, d.id
FROM memberships m
JOIN users u ON u.email = m.email
JOIN departments d ON d.name = m.dept_name
ON CONFLICT (user_id, department_id) DO NOTHING;

COMMIT;

SELECT r.name AS role, count(rp.permission_id) AS permission_count
FROM roles r
LEFT JOIN role_permissions rp ON rp.role_id = r.id
WHERE r.name IN ('ADMIN','PM','SALES','TEAM','MARKETING','ACCOUNTANT','CLIENT')
GROUP BY r.name
ORDER BY r.name;

SELECT email, role.name AS role, is_active
FROM users
JOIN roles role ON role.id = users.role_id
WHERE email IN (
  'admin@' || :'email_domain', 'sales@' || :'email_domain', 'pm@' || :'email_domain',
  'designer@' || :'email_domain', 'dev@' || :'email_domain', 'content@' || :'email_domain',
  'marketing@' || :'email_domain', 'finance@' || :'email_domain'
)
ORDER BY email;
SQL

echo
cat <<EOF
Production access bootstrap completed.
Default password for newly-created users: $DEFAULT_PASSWORD
Email domain: @$DEFAULT_EMAIL_DOMAIN
Please require the owner to change these passwords immediately.
EOF
