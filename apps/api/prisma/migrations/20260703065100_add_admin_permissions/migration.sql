-- Data migration: Add admin.* permissions for the admin dashboard v2
-- These are granted to the ADMIN role (which bypasses the PermissionsGuard),
-- but they must exist in the DB for completeness, role cloning, and future use.

INSERT INTO permissions (id, name) VALUES
  -- People & Access
  (gen_random_uuid(), 'admin.users.read'),
  (gen_random_uuid(), 'admin.users.manage'),
  (gen_random_uuid(), 'admin.users.impersonate'),
  (gen_random_uuid(), 'admin.sessions.read'),
  (gen_random_uuid(), 'admin.security.read'),
  (gen_random_uuid(), 'admin.permissions.read'),

  -- Command Center
  (gen_random_uuid(), 'admin.stats.trends'),
  (gen_random_uuid(), 'admin.alerts'),
  (gen_random_uuid(), 'admin.funnel'),
  (gen_random_uuid(), 'admin.search'),

  -- Business Operations
  (gen_random_uuid(), 'admin.projects.read'),
  (gen_random_uuid(), 'admin.projects.intervene'),
  (gen_random_uuid(), 'admin.tasks.read'),
  (gen_random_uuid(), 'admin.tasks.intervene'),
  (gen_random_uuid(), 'admin.contracts.read'),
  (gen_random_uuid(), 'admin.contracts.intervene'),
  (gen_random_uuid(), 'admin.leads.read'),
  (gen_random_uuid(), 'admin.proposals.read'),
  (gen_random_uuid(), 'admin.campaigns.read'),
  (gen_random_uuid(), 'admin.requests.read'),
  (gen_random_uuid(), 'admin.requests.intervene'),
  (gen_random_uuid(), 'admin.chat.read'),
  (gen_random_uuid(), 'admin.chat.moderate'),
  (gen_random_uuid(), 'admin.portal.read'),
  (gen_random_uuid(), 'admin.portal.manage'),

  -- Finance
  (gen_random_uuid(), 'admin.finance.read'),
  (gen_random_uuid(), 'admin.invoices.read'),
  (gen_random_uuid(), 'admin.invoices.intervene'),
  (gen_random_uuid(), 'admin.payments.read'),
  (gen_random_uuid(), 'admin.payments.intervene'),
  (gen_random_uuid(), 'admin.payroll.read'),

  -- System
  (gen_random_uuid(), 'admin.integrations'),
  (gen_random_uuid(), 'admin.automation'),
  (gen_random_uuid(), 'admin.exports'),
  (gen_random_uuid(), 'admin.reports'),
  (gen_random_uuid(), 'admin.backups'),
  (gen_random_uuid(), 'admin.storage'),
  (gen_random_uuid(), 'admin.integrity'),
  (gen_random_uuid(), 'admin.api-keys'),
  (gen_random_uuid(), 'admin.imports'),
  (gen_random_uuid(), 'admin.environment'),
  (gen_random_uuid(), 'admin.feature-flags'),
  (gen_random_uuid(), 'admin.messaging'),
  (gen_random_uuid(), 'admin.notifications.broadcast'),

  -- Performance & AI
  (gen_random_uuid(), 'admin.performance.read'),
  (gen_random_uuid(), 'admin.sales.read'),
  (gen_random_uuid(), 'admin.ai.read'),
  (gen_random_uuid(), 'admin.ai.manage')
ON CONFLICT (name) DO NOTHING;
