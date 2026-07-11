-- Data migration: Add chat permissions to ACCOUNTANT role
-- Also ensures chat permissions exist for all roles that need them

-- First ensure the chat permissions exist
INSERT INTO permissions (id, name)
VALUES
  (gen_random_uuid(), 'chat.create'),
  (gen_random_uuid(), 'chat.read'),
  (gen_random_uuid(), 'chat.update'),
  (gen_random_uuid(), 'chat.message')
ON CONFLICT (name) DO NOTHING;

-- Add chat permissions to ACCOUNTANT role
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r, permissions p
WHERE r.name = 'ACCOUNTANT'
  AND p.name IN ('chat.read', 'chat.message', 'chat.create')
  AND NOT EXISTS (
    SELECT 1 FROM role_permissions rp
    WHERE rp.role_id = r.id AND rp.permission_id = p.id
  );
