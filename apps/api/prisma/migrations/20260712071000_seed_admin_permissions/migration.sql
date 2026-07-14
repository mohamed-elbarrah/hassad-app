-- Data migration: seed admin.* permissions for existing environments
-- These permissions already exist in seed.ts for fresh installs,
-- but production databases need them via migration.

INSERT INTO permissions (id, name)
SELECT gen_random_uuid(), name
FROM (VALUES
  ('admin.stats'),
  ('admin.stats.trends'),
  ('admin.funnel'),
  ('admin.alerts'),
  ('admin.audit'),
  ('admin.dashboard'),
  ('admin.reports'),
  ('admin.settings'),
  ('admin.notifications'),
  ('admin.team'),
  ('admin.marketing'),
  ('admin.users.read'),
  ('admin.users.manage'),
  ('admin.users.impersonate'),
  ('admin.sessions.read'),
  ('admin.security.read'),
  ('admin.projects.read'),
  ('admin.tasks.read'),
  ('admin.contracts.read'),
  ('admin.leads.read'),
  ('admin.requests.read'),
  ('admin.finance.read'),
  ('admin.proposals.read'),
  ('admin.clients.read'),
  ('admin.campaigns.read'),
  ('admin.chat.read'),
  ('admin.portal.read'),
  ('admin.projects.intervene'),
  ('admin.projects.create'),
  ('admin.tasks.intervene'),
  ('admin.contracts.intervene'),
  ('admin.leads.intervene'),
  ('admin.requests.intervene'),
  ('admin.finance.intervene'),
  ('admin.proposals.intervene'),
  ('admin.campaigns.create'),
  ('admin.campaigns.intervene'),
  ('admin.chat.moderate'),
  ('admin.portal.manage'),
  ('admin.portal'),
  ('admin.clients.intervene')
) AS p(name)
WHERE NOT EXISTS (SELECT 1 FROM permissions WHERE permissions.name = p.name);

-- Assign all admin.* permissions to the ADMIN role
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r, permissions p
WHERE r.name = 'ADMIN'
  AND p.name LIKE 'admin.%'
  AND NOT EXISTS (
    SELECT 1 FROM role_permissions rp
    WHERE rp.role_id = r.id AND rp.permission_id = p.id
  );
