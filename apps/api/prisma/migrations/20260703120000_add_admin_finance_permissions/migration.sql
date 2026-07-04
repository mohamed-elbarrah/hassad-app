INSERT INTO permissions (id, name, description, module) VALUES
  (gen_random_uuid(), 'admin.finance.read', 'قراءة لوحة المالية والإيرادات', 'admin'),
  (gen_random_uuid(), 'admin.finance.intervene', 'التدخل في الفواتير والمدفوعات (شطب، استرداد، إعادة محاولة ويب هوك)', 'admin'),
  (gen_random_uuid(), 'admin.proposals.read', 'قراءة العروض الفنية', 'admin'),
  (gen_random_uuid(), 'admin.clients.read', 'قراءة العملاء مع البيانات المجمعة', 'admin')
ON CONFLICT (name) DO NOTHING;
