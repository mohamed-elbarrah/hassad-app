"use client";

import { useState } from "react";
import { Bell, Search, Pencil } from "lucide-react";
import { PageIntro } from "@/components/design-system/PageIntro";
import { SurfaceCard } from "@/components/design-system/SurfaceCard";
import { DataTable } from "@/components/design-system/DataTable";
import { ActionButton } from "@/components/design-system/ActionButton";
import { FormInputControl } from "@/components/design-system/FormInputControl";
import { Dialog } from "@/components/design-system/Dialog";
import { toast } from "sonner";

const MOCK_TEMPLATES = [
  { id: "1", eventType: "TASK_ASSIGNED", title: "مهمة جديدة", titleAr: "تم تعيين مهمة جديدة", bodyAr: "مرحباً، تم تعيين مهمة '{task_title}' لك في مشروع '{project_name}'" },
  { id: "2", eventType: "INVOICE_CREATED", title: "فاتورة جديدة", titleAr: "تم إنشاء فاتورة جديدة", bodyAr: "تم إنشاء فاتورة رقم '{invoice_number}' بمبلغ {amount}" },
  { id: "3", eventType: "PAYMENT_RECEIVED", title: "تم استلام الدفع", titleAr: "تم استلام الدفع", bodyAr: "تم استلام دفعة بمبلغ {amount} للفاتورة رقم '{invoice_number}'" },
  { id: "4", eventType: "PROJECT_COMPLETED", title: "اكتمال المشروع", titleAr: "تم اكتمال المشروع", bodyAr: "تم اكتمال مشروع '{project_name}' بنجاح" },
  { id: "5", eventType: "LEAD_ASSIGNED", title: "عميل محتمل جديد", titleAr: "تم تعيين عميل محتمل", bodyAr: "تم تعيين العميل المحتمل '{lead_name}' لك" },
];

export default function AdminNotificationTemplatesPage() {
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<any>(null);
  const [showEdit, setShowEdit] = useState(false);
  const [editForm, setEditForm] = useState({ titleAr: "", bodyAr: "" });

  const filtered = MOCK_TEMPLATES.filter((t) =>
    t.eventType.includes(search) || t.titleAr.includes(search)
  );

  return (
    <div className="flex flex-col gap-6" dir="rtl">
      <PageIntro title="قوالب الإشعارات" description="إدارة محتوى الإشعارات المرسلة للمستخدمين" icon={Bell} />

      <SurfaceCard>
        <div className="relative max-w-sm mb-4">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 size-4 text-portal-note-text" />
          <FormInputControl placeholder="ابحث عن قالب..." value={search} onChange={(e) => setSearch(e.target.value)} className="pr-10" />
        </div>

        <DataTable
          columns={[{ id: "event", label: "الحدث" }, { id: "title", label: "العنوان" }, { id: "body", label: "المحتوى" }, { id: "actions", label: "", align: "left" }]}
          data={filtered} isLoading={false} isError={false}
          emptyState={{ icon: Bell, message: "لا توجد قوالب", hint: "لم يتم العثور على قوالب إشعارات" }}
          renderRow={(t: any) => (
            <tr key={t.id} className="border-b border-portal-divider">
              <td className="px-5 py-3 text-sm font-medium">{t.eventType}</td>
              <td className="px-5 py-3 text-sm">{t.titleAr}</td>
              <td className="px-5 py-3 text-sm text-portal-note-text max-w-md truncate">{t.bodyAr}</td>
              <td className="px-5 py-3 text-left">
                <ActionButton variant="ghost" size="sm" onClick={() => { setSelected(t); setEditForm({ titleAr: t.titleAr, bodyAr: t.bodyAr }); setShowEdit(true); }}>
                  <Pencil className="size-4" />
                </ActionButton>
              </td>
            </tr>
          )}
        />
      </SurfaceCard>

      <Dialog open={showEdit} onOpenChange={setShowEdit} title="تعديل قالب الإشعار"
        footer={<div className="flex gap-2 justify-end">
          <ActionButton variant="outline" onClick={() => setShowEdit(false)}>إلغاء</ActionButton>
          <ActionButton onClick={() => { toast.success("تم حفظ القالب"); setShowEdit(false); }}>حفظ</ActionButton>
        </div>}>
        <div className="space-y-4">
          <p className="text-sm text-portal-note-text">الحدث: {selected?.eventType}</p>
          <FormInputControl label="العنوان (عربي)" value={editForm.titleAr} onChange={(e) => setEditForm({ ...editForm, titleAr: e.target.value })} />
          <div>
            <label className="block text-sm text-portal-note-text mb-1">المحتوى (عربي)</label>
            <textarea value={editForm.bodyAr} onChange={(e) => setEditForm({ ...editForm, bodyAr: e.target.value })}
              className="w-full rounded-xl border border-portal-divider px-4 py-2.5 text-sm min-h-[120px]" />
          </div>
          <p className="text-xs text-portal-note-text">المتغيرات المدعومة: {'{task_title}'}, {'{project_name}'}, {'{invoice_number}'}, {'{amount}'}, {'{lead_name}'}</p>
        </div>
      </Dialog>
    </div>
  );
}
