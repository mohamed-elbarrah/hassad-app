INSERT INTO permissions (id, name) VALUES
  (gen_random_uuid(), 'admin.finance.read'),
  (gen_random_uuid(), 'admin.finance.intervene'),
  (gen_random_uuid(), 'admin.proposals.read'),
  (gen_random_uuid(), 'admin.clients.read')
ON CONFLICT (name) DO NOTHING;
