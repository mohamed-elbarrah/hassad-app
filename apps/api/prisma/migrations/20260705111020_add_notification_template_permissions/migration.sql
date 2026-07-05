INSERT INTO permissions (id, name)
VALUES
  (gen_random_uuid(), 'notification-templates.read'),
  (gen_random_uuid(), 'notification-templates.update')
ON CONFLICT (name) DO NOTHING;
