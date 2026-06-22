-- Add dispute system permissions
INSERT INTO permissions (id, name) VALUES 
  (gen_random_uuid(), 'disputes.create'),
  (gen_random_uuid(), 'disputes.read'),
  (gen_random_uuid(), 'disputes.pm_read'),
  (gen_random_uuid(), 'disputes.pm_update'),
  (gen_random_uuid(), 'disputes.admin')
ON CONFLICT (name) DO NOTHING;

-- Add dispute permissions to ADMIN role
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r, permissions p
WHERE r.name = 'ADMIN' AND p.name LIKE 'disputes.%'
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- Add dispute permissions to PM role
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r, permissions p
WHERE r.name = 'PM' AND p.name IN ('disputes.pm_read', 'disputes.pm_update')
ON CONFLICT (role_id, permission_id) DO NOTHING;