INSERT INTO notification_templates (id, event_type, title, body, is_active, created_at, updated_at)
VALUES
  (gen_random_uuid(), 'TASK_ASSIGNED', 'مهمة جديدة', 'مرحباً، تم تعيين مهمة ''{task_title}'' لك في مشروع ''{project_name}''', true, now(), now()),
  (gen_random_uuid(), 'INVOICE_CREATED', 'فاتورة جديدة', 'تم إنشاء فاتورة رقم ''{invoice_number}'' بمبلغ {amount}', true, now(), now()),
  (gen_random_uuid(), 'PAYMENT_RECEIVED', 'تم استلام الدفع', 'تم استلام دفعة بمبلغ {amount} للفاتورة رقم ''{invoice_number}''', true, now(), now()),
  (gen_random_uuid(), 'PROJECT_COMPLETED', 'اكتمال المشروع', 'تم اكتمال مشروع ''{project_name}'' بنجاح', true, now(), now()),
  (gen_random_uuid(), 'LEAD_ASSIGNED', 'عميل محتمل جديد', 'تم تعيين العميل المحتمل ''{lead_name}'' لك', true, now(), now())
ON CONFLICT (event_type) DO NOTHING;
