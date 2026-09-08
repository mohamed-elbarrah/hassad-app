-- Reconcile permissions and role grants for production.
-- This migration is additive and idempotent. It never deletes existing
-- permissions or role grants and does not depend on prisma db seed.

INSERT INTO "permissions" ("id", "name")
SELECT gen_random_uuid(), p."name"
FROM (VALUES
  ('chat.create'), ('chat.read'), ('chat.update'), ('chat.message'),
  ('clients.create'), ('clients.handover'), ('clients.read'),
  ('clients.read_activity'), ('clients.update'),
  ('projects.create'), ('projects.read'), ('projects.update'),
  ('projects.archive'), ('projects.manage_members'),
  ('proposals.create'), ('proposals.read'), ('proposals.read_public'),
  ('proposals.update'), ('proposals.send'), ('proposals.approve'),
  ('proposals.reject'),
  ('tasks.read'), ('tasks.create'), ('tasks.update'), ('tasks.assign'),
  ('tasks.approve'), ('tasks.comment'), ('tasks.delete'),
  ('notifications.read'), ('notifications.update'), ('notifications.broadcast'),
  ('notification-templates.read'), ('notification-templates.update'),
  ('marketing.manage_tests'), ('marketing.create'), ('marketing.read'),
  ('marketing.update'), ('marketing.delete'), ('marketing.manage_kpis'),
  ('marketing.flag_optimization'),
  ('portal.read'), ('portal.manage_deliverables'),
  ('portal.approve_deliverables'), ('portal.request_revisions'),
  ('portal.manage_intake'),
  ('finance.create_invoice'), ('finance.read'), ('finance.update_invoice'),
  ('finance.manage_tickets'), ('finance.read_ledger'), ('finance.manage_payroll'),
  ('requests.create'), ('requests.read'), ('requests.update'),
  ('requests.assign'), ('requests.convert'), ('requests.delete'),
  ('automation.create'), ('automation.read'), ('automation.execute'),
  ('contracts.create'), ('contracts.read'), ('contracts.update'),
  ('contracts.send'), ('contracts.sign'), ('contracts.activate'),
  ('contracts.cancel'), ('contracts.manage_versions'),
  ('contracts.manage_payment_plan'), ('contracts.read_public'),
  ('contracts.sign_public'), ('invoices.pay_public'),
  ('services.create'), ('services.read'), ('services.update'),
  ('services.delete'),
  ('disputes.create'), ('disputes.read'), ('disputes.pm_read'),
  ('disputes.pm_update'), ('disputes.admin'),
  ('admin.stats'), ('admin.stats.trends'), ('admin.funnel'), ('admin.alerts'),
  ('admin.audit'), ('admin.dashboard'), ('admin.reports'), ('admin.settings'),
  ('admin.notifications'), ('admin.team'), ('admin.marketing'),
  ('admin.users.read'), ('admin.users.manage'), ('admin.users.impersonate'),
  ('admin.sessions.read'), ('admin.security.read'), ('admin.projects.read'),
  ('admin.tasks.read'), ('admin.contracts.read'), ('admin.requests.read'),
  ('admin.finance.read'), ('admin.proposals.read'), ('admin.clients.read'),
  ('admin.campaigns.read'), ('admin.chat.read'), ('admin.portal.read'),
  ('admin.projects'), ('admin.ai.read'), ('admin.ai.manage'),
  ('admin.business_goals.read'), ('admin.business_goals.create'),
  ('admin.business_goals.update'), ('admin.business_goals.delete'),
  ('admin.projects.intervene'), ('admin.projects.create'),
  ('admin.tasks.intervene'), ('admin.contracts.intervene'),
  ('admin.requests.intervene'), ('admin.finance.intervene'),
  ('admin.proposals.intervene'), ('admin.campaigns.create'),
  ('admin.campaigns.intervene'), ('admin.chat.moderate'),
  ('admin.portal.manage'), ('admin.clients.intervene'), ('admin.portal'),
  ('ai.read'), ('ai.analyze'), ('ai.manage_suggestions'),
  ('finance.admin'), ('sales.read'), ('users.create'), ('users.read'),
  ('users.update'), ('users.delete'), ('roles.create'), ('roles.read'),
  ('roles.update'), ('roles.assign_permissions'), ('permissions.read'),
  ('departments.create'), ('departments.read'), ('departments.assign')
) AS p("name")
ON CONFLICT ("name") DO NOTHING;

-- ADMIN is intentionally granted the complete canonical permission set.
INSERT INTO "role_permissions" ("role_id", "permission_id")
SELECT r."id", p."id"
FROM "roles" r
CROSS JOIN "permissions" p
WHERE r."name" = 'ADMIN'
ON CONFLICT ("role_id", "permission_id") DO NOTHING;

-- Non-admin role grants mirror the canonical production policy.
INSERT INTO "role_permissions" ("role_id", "permission_id")
SELECT r."id", p."id"
FROM "roles" r
CROSS JOIN "permissions" p
WHERE r."name" = 'PM'
  AND p."name" IN (
    'projects.create', 'projects.read', 'projects.update',
    'projects.manage_members', 'tasks.read', 'tasks.create', 'tasks.assign',
    'tasks.update', 'tasks.approve', 'tasks.comment', 'proposals.read',
    'proposals.update', 'proposals.approve', 'proposals.reject',
    'notifications.read', 'notifications.update', 'finance.read',
    'finance.update_invoice', 'marketing.read', 'portal.read', 'services.read',
    'chat.create', 'chat.read', 'chat.message', 'clients.read',
    'disputes.pm_read', 'disputes.pm_update'
  )
ON CONFLICT ("role_id", "permission_id") DO NOTHING;

INSERT INTO "role_permissions" ("role_id", "permission_id")
SELECT r."id", p."id"
FROM "roles" r
CROSS JOIN "permissions" p
WHERE r."name" = 'SALES'
  AND p."name" IN (
    'requests.create', 'requests.read', 'requests.update', 'requests.assign',
    'proposals.create', 'proposals.read', 'proposals.send',
    'proposals.read_public', 'contracts.create', 'contracts.read',
    'contracts.update', 'contracts.send', 'contracts.sign', 'contracts.activate',
    'contracts.cancel', 'contracts.manage_versions',
    'contracts.manage_payment_plan', 'notifications.read',
    'notifications.update', 'services.read', 'chat.create', 'chat.read',
    'chat.message', 'clients.read', 'clients.create', 'clients.update',
    'clients.read_activity'
  )
ON CONFLICT ("role_id", "permission_id") DO NOTHING;

INSERT INTO "role_permissions" ("role_id", "permission_id")
SELECT r."id", p."id"
FROM "roles" r
CROSS JOIN "permissions" p
WHERE r."name" = 'TEAM'
  AND p."name" IN (
    'tasks.read', 'tasks.update', 'tasks.comment', 'projects.read',
    'notifications.read', 'notifications.update', 'chat.read', 'chat.message'
  )
ON CONFLICT ("role_id", "permission_id") DO NOTHING;

INSERT INTO "role_permissions" ("role_id", "permission_id")
SELECT r."id", p."id"
FROM "roles" r
CROSS JOIN "permissions" p
WHERE r."name" = 'MARKETING'
  AND p."name" IN (
    'marketing.create', 'marketing.read', 'marketing.update', 'marketing.delete',
    'marketing.manage_tests', 'marketing.manage_kpis',
    'marketing.flag_optimization', 'tasks.read', 'tasks.update',
    'tasks.comment', 'notifications.read', 'chat.read', 'chat.message'
  )
ON CONFLICT ("role_id", "permission_id") DO NOTHING;

INSERT INTO "role_permissions" ("role_id", "permission_id")
SELECT r."id", p."id"
FROM "roles" r
CROSS JOIN "permissions" p
WHERE r."name" = 'ACCOUNTANT'
  AND p."name" IN (
    'finance.create_invoice', 'finance.read', 'finance.update_invoice',
    'finance.manage_tickets', 'finance.read_ledger', 'finance.manage_payroll',
    'notifications.read', 'chat.read', 'chat.message'
  )
ON CONFLICT ("role_id", "permission_id") DO NOTHING;

INSERT INTO "role_permissions" ("role_id", "permission_id")
SELECT r."id", p."id"
FROM "roles" r
CROSS JOIN "permissions" p
WHERE r."name" = 'CLIENT'
  AND p."name" IN (
    'proposals.read_public', 'notifications.read', 'requests.create',
    'contracts.read_public', 'contracts.sign_public', 'invoices.pay_public',
    'portal.read', 'portal.manage_intake', 'portal.approve_deliverables',
    'portal.request_revisions', 'services.read', 'chat.read',
    'chat.message'
  )
ON CONFLICT ("role_id", "permission_id") DO NOTHING;
