-- Data migration: seed Core permissions for existing and new environments.
-- Core administration permissions remain ADMIN-only; ADMIN bypasses the guard,
-- while the explicit rows support permission inspection and future role changes.

INSERT INTO roles (id, name)
VALUES (gen_random_uuid(), 'ADMIN')
ON CONFLICT (name) DO NOTHING;

INSERT INTO permissions (id, name)
VALUES
  (gen_random_uuid(), 'users.create'),
  (gen_random_uuid(), 'users.read'),
  (gen_random_uuid(), 'users.update'),
  (gen_random_uuid(), 'users.delete'),
  (gen_random_uuid(), 'roles.read'),
  (gen_random_uuid(), 'roles.create'),
  (gen_random_uuid(), 'roles.update'),
  (gen_random_uuid(), 'roles.assign_permissions'),
  (gen_random_uuid(), 'permissions.read'),
  (gen_random_uuid(), 'departments.read'),
  (gen_random_uuid(), 'departments.create'),
  (gen_random_uuid(), 'departments.assign')
ON CONFLICT (name) DO NOTHING;

DELETE FROM user_permissions
USING users, roles, permissions
WHERE user_permissions.user_id = users.id
  AND users.role_id = roles.id
  AND user_permissions.permission_id = permissions.id
  AND roles.name <> 'ADMIN'
  AND permissions.name IN (
    'users.create',
    'users.read',
    'users.update',
    'users.delete',
    'roles.read',
    'roles.create',
    'roles.update',
    'roles.assign_permissions',
    'permissions.read',
    'departments.read',
    'departments.create',
    'departments.assign'
  );

DELETE FROM role_permissions
USING roles, permissions
WHERE role_permissions.role_id = roles.id
  AND role_permissions.permission_id = permissions.id
  AND roles.name <> 'ADMIN'
  AND permissions.name IN (
    'users.create',
    'users.read',
    'users.update',
    'users.delete',
    'roles.read',
    'roles.create',
    'roles.update',
    'roles.assign_permissions',
    'permissions.read',
    'departments.read',
    'departments.create',
    'departments.assign'
  );

INSERT INTO role_permissions (role_id, permission_id)
SELECT roles.id, permissions.id
FROM roles
CROSS JOIN permissions
WHERE roles.name = 'ADMIN'
  AND permissions.name IN (
    'users.create',
    'users.read',
    'users.update',
    'users.delete',
    'roles.read',
    'roles.create',
    'roles.update',
    'roles.assign_permissions',
    'permissions.read',
    'departments.read',
    'departments.create',
    'departments.assign'
  )
ON CONFLICT (role_id, permission_id) DO NOTHING;
