-- Seed notification templates for Phase 5 alert event types
-- Run as a data migration (no schema changes)

INSERT INTO notification_templates (id, event_type, title, body, is_active, created_at, updated_at)
VALUES
  (gen_random_uuid(), 'PROJECT_STALLED', 'مشروع متعثر', 'المشروع "{{projectName}}" متعثر (الحالة: {{status}}). يرجى المراجعة.', true, NOW(), NOW()),
  (gen_random_uuid(), 'UNASSIGNED_LEAD', 'عميل متوقع غير معين', 'يوجد {{count}} عميل متوقع غير معين. يرجى توزيعهم على فريق المبيعات.', true, NOW(), NOW()),
  (gen_random_uuid(), 'UNASSIGNED_REQUEST', 'طلب غير معين', 'يوجد {{count}} طلب غير معين. يرجى توزيعهم على فريق المبيعات.', true, NOW(), NOW()),
  (gen_random_uuid(), 'SYSTEM_FAILURE', 'خطأ في النظام', 'يوجد {{webhookCount}} خطأ ويب هوك و {{gatewayCount}} خطأ بوابة دفع بحاجة للمراجعة.', true, NOW(), NOW()),
  (gen_random_uuid(), 'CLIENT_INACTIVE', 'عميل غير نشط', 'العميل "{{clientName}}" غير نشط منذ أكثر من 30 يوماً. يرجى التواصل معهم.', true, NOW(), NOW()),
  (gen_random_uuid(), 'WORKLOAD_WARNING', 'حمل عمل', '{{message}}', true, NOW(), NOW()),
  (gen_random_uuid(), 'TASK_DELAYED', 'مهمة متأخرة', 'المهمة "{{taskName}}" متأخرة {{days}} يوماً.', true, NOW(), NOW()),
  (gen_random_uuid(), 'STALE_LEAD', 'عميل متوقع بحاجة للمتابعة', 'العميل المتوقع "{{companyName}}" لم يتم التواصل معه منذ 14 يوماً.', true, NOW(), NOW()),
  (gen_random_uuid(), 'STALE_REQUEST', 'طلب بحاجة للمتابعة', 'الطلب "{{companyName}}" لم يتم تحديثه منذ 14 يوماً.', true, NOW(), NOW()),
  (gen_random_uuid(), 'INVOICE_ESCALATED', 'فاتورة متأخرة', 'يوجد {{count}} فاتورة متأخرة منذ أكثر من 30 يوماً.', true, NOW(), NOW()),
  (gen_random_uuid(), 'RENEWAL_ESCALATED', 'تجديد عقد عاجل', 'العقد "{{contractTitle}}" مع {{clientName}} ينتهي قريباً ولم يتم اتخاذ إجراء.', true, NOW(), NOW())
ON CONFLICT (event_type) DO NOTHING;
