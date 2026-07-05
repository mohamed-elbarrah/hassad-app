"use client";

import { useState } from "react";
import { Bell, Search, Pencil, Loader2 } from "lucide-react";
import { PageIntro } from "@/components/design-system/PageIntro";
import { SurfaceCard } from "@/components/design-system/SurfaceCard";
import { DataTable } from "@/components/design-system/DataTable";
import { ActionButton } from "@/components/design-system/ActionButton";
import { FormInputControl } from "@/components/design-system/FormInputControl";
import { Dialog } from "@/components/design-system/Dialog";
import { toast } from "sonner";
import {
  useGetNotificationTemplatesQuery,
  useUpdateNotificationTemplateMutation,
} from "@/features/notification-templates/notificationTemplatesApi";

export default function AdminNotificationTemplatesPage() {
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<any>(null);
  const [showEdit, setShowEdit] = useState(false);
  const [editForm, setEditForm] = useState({ title: "", body: "" });

  const { data: templates, isLoading, isError } = useGetNotificationTemplatesQuery();
  const [updateTemplate, { isLoading: updating }] = useUpdateNotificationTemplateMutation();

  const filtered = (templates ?? []).filter(
    (t) => t.eventType.includes(search) || t.title.includes(search),
  );

  const handleSave = async () => {
    if (!selected) return;
    try {
      await updateTemplate({
        id: selected.id,
        title: editForm.title,
        body: editForm.body,
      }).unwrap();
      toast.success("تم حفظ القالب");
      setShowEdit(false);
    } catch {
      toast.error("حدث خطأ أثناء حفظ القالب");
    }
  };

  return (
    <div className="flex flex-col gap-6" dir="rtl">
      <PageIntro
        title="قوالب الإشعارات"
        description="إدارة محتوى الإشعارات المرسلة للمستخدمين"
        icon={Bell}
      />

      <SurfaceCard>
        <div className="relative max-w-sm mb-4">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 size-4 text-portal-note-text" />
          <FormInputControl
            placeholder="ابحث عن قالب..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pr-10"
          />
        </div>

        <DataTable
          columns={[
            { id: "event", label: "الحدث" },
            { id: "title", label: "العنوان" },
            { id: "body", label: "المحتوى" },
            { id: "active", label: "مفعل" },
            { id: "actions", label: "", align: "left" },
          ]}
          data={filtered}
          isLoading={isLoading}
          isError={isError}
          emptyState={{
            icon: Bell,
            message: "لا توجد قوالب",
            hint: "لم يتم العثور على قوالب إشعارات",
          }}
          renderRow={(t: any) => (
            <tr key={t.id} className="border-b border-portal-divider">
              <td className="px-5 py-3 text-sm font-medium">{t.eventType}</td>
              <td className="px-5 py-3 text-sm">{t.title}</td>
              <td className="px-5 py-3 text-sm text-portal-note-text max-w-md truncate">
                {t.body}
              </td>
              <td className="px-5 py-3 text-sm">
                {t.isActive ? (
                  <span className="text-success-600">نشط</span>
                ) : (
                  <span className="text-portal-note-text">غير نشط</span>
                )}
              </td>
              <td className="px-5 py-3 text-left">
                <ActionButton
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setSelected(t);
                    setEditForm({ title: t.title, body: t.body });
                    setShowEdit(true);
                  }}
                >
                  <Pencil className="size-4" />
                </ActionButton>
              </td>
            </tr>
          )}
        />
      </SurfaceCard>

      <Dialog
        open={showEdit}
        onOpenChange={setShowEdit}
        title="تعديل قالب الإشعار"
        footer={
          <div className="flex gap-2 justify-end">
            <ActionButton variant="outline" onClick={() => setShowEdit(false)}>
              إلغاء
            </ActionButton>
            <ActionButton onClick={handleSave} disabled={updating}>
              {updating ? <Loader2 className="size-4 animate-spin" /> : null}
              حفظ
            </ActionButton>
          </div>
        }
      >
        <div className="space-y-4">
          <p className="text-sm text-portal-note-text">
            الحدث: {selected?.eventType}
          </p>
          <div>
            <label className="block text-sm text-portal-note-text mb-1">
              العنوان
            </label>
            <FormInputControl
              value={editForm.title}
              onChange={(e) =>
                setEditForm({ ...editForm, title: e.target.value })
              }
            />
          </div>
          <div>
            <label className="block text-sm text-portal-note-text mb-1">
              المحتوى
            </label>
            <textarea
              value={editForm.body}
              onChange={(e) =>
                setEditForm({ ...editForm, body: e.target.value })
              }
              className="w-full rounded-xl border border-portal-divider px-4 py-2.5 text-sm min-h-[120px]"
            />
          </div>
          <p className="text-xs text-portal-note-text">
            المتغيرات المدعومة: {"{task_title}"}, {"{project_name}"},{" "}
            {"{invoice_number}"}, {"{amount}"}, {"{lead_name}"}
          </p>
        </div>
      </Dialog>
    </div>
  );
}
