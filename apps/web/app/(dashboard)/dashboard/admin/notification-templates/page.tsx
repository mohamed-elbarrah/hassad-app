"use client";

import { useState } from "react";
import {
  Bell,
  Search,
  Pencil,
  Loader2,
  Send,
  Eye,
  ListChecks,
  ToggleLeft,
  ToggleRight,
  ScrollText,
  Smartphone,
  Mail,
} from "lucide-react";
import { PageIntro } from "@/components/design-system/PageIntro";
import { SurfaceCard } from "@/components/design-system/SurfaceCard";
import { DataTable } from "@/components/design-system/DataTable";
import { ActionButton } from "@/components/design-system/ActionButton";
import { FormInputControl } from "@/components/design-system/FormInputControl";
import { Dialog } from "@/components/design-system/Dialog";
import { Pill } from "@/components/design-system/Pill";
import { EmptyState } from "@/components/design-system/EmptyState";
import { toast } from "sonner";
import {
  useGetAdminNotificationTemplatesQuery,
  useGetAdminNotificationEventTypesQuery,
  useUpdateAdminNotificationTemplateMutation,
  useGetAdminTemplateLogsQuery,
  useBroadcastNotificationMutation,
} from "@/features/admin/adminApi";
import { USER_ROLE_AR } from "@hassad/shared";
import { useSearchUsersQuery } from "@/features/users/usersApi";

export default function AdminNotificationTemplatesPage() {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<any>(null);
  const [showEdit, setShowEdit] = useState(false);
  const [showBroadcast, setShowBroadcast] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [showSendLog, setShowSendLog] = useState(false);
  const [logTemplateId, setLogTemplateId] = useState<string | null>(null);

  const { data: templateLogs } = useGetAdminTemplateLogsQuery(logTemplateId ?? "", {
    skip: !logTemplateId,
  });
  const [userSearch, setUserSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [editForm, setEditForm] = useState({ title: "", body: "", isActive: true });
  const [broadcastForm, setBroadcastForm] = useState({
    recipientType: "all",
    recipientId: "",
    title: "",
    body: "",
  });

  const { data: templatesData, isLoading, isError } = useGetAdminNotificationTemplatesQuery({
    page,
    limit: 50,
  });
  const { data: eventTypes } = useGetAdminNotificationEventTypesQuery();
  const [updateTemplate, { isLoading: updating }] = useUpdateAdminNotificationTemplateMutation();
  const [broadcast, { isLoading: sending }] = useBroadcastNotificationMutation();
  const { data: usersData } = useSearchUsersQuery({
    search: userSearch || undefined,
    limit: 20,
    role: (roleFilter || undefined) as any,
  });
  const users = usersData?.items ?? [];

  const templates = templatesData?.items ?? templatesData ?? [];
  const eventTypesList = eventTypes?.items ?? eventTypes ?? [];

  const filtered = templates.filter(
    (t: any) => t.eventType?.includes(search) || t.title?.includes(search),
  );

  const handleSave = async () => {
    if (!selected) return;
    try {
      await updateTemplate({
        id: selected.id,
        data: {
          title: editForm.title,
          body: editForm.body,
          isActive: editForm.isActive,
        },
      }).unwrap();
      toast.success("تم حفظ القالب");
      setShowEdit(false);
    } catch {
      toast.error("حدث خطأ أثناء حفظ القالب");
    }
  };

  const handleToggleActive = async (t: any) => {
    try {
      await updateTemplate({
        id: t.id,
        data: { isActive: !t.isActive },
      }).unwrap();
      toast.success(t.isActive ? "تم تعطيل القالب" : "تم تفعيل القالب");
    } catch {
      toast.error("حدث خطأ");
    }
  };

  const handleBroadcast = async () => {
    if (!broadcastForm.title || !broadcastForm.body) {
      toast.error("يرجى إدخال العنوان والمحتوى");
      return;
    }
    try {
      const payload: any = {
        title: broadcastForm.title,
        body: broadcastForm.body,
      };
      if (broadcastForm.recipientType === "role" && broadcastForm.recipientId) {
        payload.role = broadcastForm.recipientId;
      } else if (broadcastForm.recipientType === "user" && broadcastForm.recipientId) {
        payload.userId = broadcastForm.recipientId;
      }
      await broadcast(payload).unwrap();
      toast.success("تم إرسال الإشعار");
      setShowBroadcast(false);
      setBroadcastForm({ recipientType: "all", recipientId: "", title: "", body: "" });
    } catch {
      toast.error("حدث خطأ أثناء الإرسال");
    }
  };

  return (
    <div className="flex flex-col gap-6" dir="rtl">
      <PageIntro
        title="قوالب الإشعارات"
        description="إدارة محتوى الإشعارات المرسلة للمستخدمين"
        icon={Bell}
        actions={
          <ActionButton size="md" onClick={() => setShowBroadcast(true)}>
            <Send className="size-4 ml-1" />
            إرسال إشعار جماعي
          </ActionButton>
        }
      />

      {/* Event Types Section */}
      {eventTypesList.length > 0 && (
        <SurfaceCard>
          <div className="flex items-center gap-2 mb-4">
            <ListChecks className="size-5 text-secondary-500" />
            <h3 className="font-semibold text-natural-100">أنواع الأحداث</h3>
          </div>
          <div className="flex flex-wrap gap-2">
            {eventTypesList.map((et: any) => (
              <Pill key={et.value ?? et} tone="blue">
                {et.label ?? et.value ?? et}
              </Pill>
            ))}
          </div>
        </SurfaceCard>
      )}

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
            { id: "event", label: "نوع الحدث" },
            { id: "title", label: "العنوان" },
            { id: "active", label: "الحالة" },
            { id: "updatedAt", label: "تاريخ التحديث" },
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
            <tr key={t.id} className="border-b border-portal-divider cursor-pointer hover:bg-badge-gray-bg/40" onClick={() => {
              setSelected(t);
              setEditForm({ title: t.title, body: t.body, isActive: t.isActive });
              setShowEdit(true);
            }}>
              <td className="px-5 py-3 text-sm font-medium">{t.eventType}</td>
              <td className="px-5 py-3 text-sm">{t.title}</td>
              <td className="px-5 py-3 text-sm">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleToggleActive(t);
                  }}
                  className="flex items-center gap-1.5 text-sm"
                >
                  {t.isActive ? (
                    <span className="flex items-center gap-1 text-success-600">
                      <ToggleRight className="size-4" />
                      نشط
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-portal-note-text">
                      <ToggleLeft className="size-4" />
                      غير نشط
                    </span>
                  )}
                </button>
              </td>
              <td className="px-5 py-3 text-sm text-portal-note-text">
                {t.updatedAt ? new Date(t.updatedAt).toLocaleDateString("ar-SA") : "—"}
              </td>
              <td className="px-5 py-3 text-left" onClick={(e) => e.stopPropagation()}>
                <div className="flex gap-1 justify-end">
                  <ActionButton
                    variant="ghost"
                    size="sm"
                    title="سجل الإرسال"
                    onClick={() => {
                      setLogTemplateId(t.id);
                      setShowSendLog(true);
                    }}
                  >
                    <ScrollText className="size-4" />
                  </ActionButton>
                  <ActionButton
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setSelected(t);
                      setEditForm({ title: t.title, body: t.body, isActive: t.isActive });
                      setShowEdit(true);
                    }}
                  >
                    <Pencil className="size-4" />
                  </ActionButton>
                </div>
              </td>
            </tr>
          )}
        />
      </SurfaceCard>

      {/* Broadcast History */}
      <SurfaceCard>
        <div className="flex items-center gap-2 mb-4">
          <Send className="size-5 text-secondary-500" />
          <h3 className="font-semibold text-natural-100">سجل البث</h3>
        </div>
        <EmptyState
          icon={Send}
          title="لم يتم إرسال أي إشعارات جماعية بعد"
          hint="عند إرسال إشعار جماعي ستظهر سجلات الإرسال هنا"
        />
      </SurfaceCard>

      {/* Edit Dialog */}
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
            نوع الحدث: {selected?.eventType}
          </p>
          <div>
            <label className="block text-sm text-portal-note-text mb-1">العنوان</label>
            <FormInputControl
              value={editForm.title}
              onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-sm text-portal-note-text mb-1">المحتوى</label>
            <textarea
              value={editForm.body}
              onChange={(e) => setEditForm({ ...editForm, body: e.target.value })}
              className="w-full rounded-xl border border-portal-divider px-4 py-2.5 text-sm min-h-[120px]"
            />
          </div>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={editForm.isActive}
              onChange={(e) => setEditForm({ ...editForm, isActive: e.target.checked })}
              className="rounded border-portal-divider"
            />
            <span className="text-sm">نشط</span>
          </label>
          <p className="text-xs text-portal-note-text">
            المتغيرات المدعومة: {"{task_title}"}, {"{project_name}"},{" "}
            {"{invoice_number}"}, {"{amount}"}, {"{lead_name}"}
          </p>
        </div>
      </Dialog>

      {/* Broadcast Dialog */}
      <Dialog
        open={showBroadcast}
        onOpenChange={setShowBroadcast}
        title="إرسال إشعار"
        contentClassName="sm:max-w-lg"
        footer={
          <div className="flex gap-2 justify-end">
            <ActionButton variant="outline" onClick={() => setShowBroadcast(false)}>
              إلغاء
            </ActionButton>
            <ActionButton
              variant="outline"
              onClick={() => setShowPreview(true)}
              disabled={!broadcastForm.title && !broadcastForm.body}
            >
              <Eye className="size-4 ml-1" />
              معاينة
            </ActionButton>
            <ActionButton onClick={handleBroadcast} disabled={sending}>
              {sending ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4 ml-1" />}
              إرسال
            </ActionButton>
          </div>
        }
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm text-portal-note-text mb-1">نوع المستلم</label>
            <select
              value={broadcastForm.recipientType}
              onChange={(e) => {
                setBroadcastForm({ ...broadcastForm, recipientType: e.target.value, recipientId: "" });
                setUserSearch("");
                setRoleFilter("");
              }}
              className="w-full rounded-xl border border-portal-divider px-4 py-2.5 text-sm"
            >
              <option value="all">الكل</option>
              <option value="role">دور محدد</option>
              <option value="user">مستخدم محدد</option>
            </select>
          </div>
          {broadcastForm.recipientType === "role" && (
            <div>
              <label className="block text-sm text-portal-note-text mb-1">الدور</label>
              <select
                value={broadcastForm.recipientId}
                onChange={(e) => setBroadcastForm({ ...broadcastForm, recipientId: e.target.value })}
                className="w-full rounded-xl border border-portal-divider px-4 py-2.5 text-sm"
              >
                <option value="">اختر الدور...</option>
                {Object.entries(USER_ROLE_AR).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </div>
          )}
          {broadcastForm.recipientType === "user" && (
            <div>
              <label className="block text-sm text-portal-note-text mb-1">المستخدم</label>
              <FormInputControl
                placeholder="ابحث عن مستخدم..."
                value={userSearch}
                onChange={(e) => setUserSearch(e.target.value)}
              />
              {users.length > 0 && (
                <div className="max-h-40 overflow-y-auto mt-2 space-y-1 border border-portal-divider rounded-xl p-1">
                  {users.map((u: any) => (
                    <button
                      key={u.id}
                      onClick={() => {
                        setBroadcastForm({ ...broadcastForm, recipientId: u.id });
                        setUserSearch(u.name);
                      }}
                      className={`w-full text-right px-3 py-2 rounded-lg text-sm transition-colors ${
                        broadcastForm.recipientId === u.id
                          ? "bg-secondary-50 text-secondary-600"
                          : "hover:bg-badge-gray-bg"
                      }`}
                    >
                      {u.name} — {u.email}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
          <div>
            <label className="block text-sm text-portal-note-text mb-1">العنوان</label>
            <FormInputControl
              value={broadcastForm.title}
              onChange={(e) => setBroadcastForm({ ...broadcastForm, title: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-sm text-portal-note-text mb-1">المحتوى</label>
            <textarea
              value={broadcastForm.body}
              onChange={(e) => setBroadcastForm({ ...broadcastForm, body: e.target.value })}
              className="w-full rounded-xl border border-portal-divider px-4 py-2.5 text-sm min-h-[120px]"
            />
          </div>
        </div>
      </Dialog>

      {/* Send Log Dialog */}
      <Dialog
        open={showSendLog}
        onOpenChange={(o) => {
          if (!o) {
            setShowSendLog(false);
            setLogTemplateId(null);
          }
        }}
        title="سجل الإرسال"
        contentClassName="sm:max-w-2xl"
        footer={
          <ActionButton variant="outline" onClick={() => { setShowSendLog(false); setLogTemplateId(null); }}>
            إغلاق
          </ActionButton>
        }
      >
        {templateLogs?.items?.length > 0 ? (
          <div className="space-y-3">
            {templateLogs.items.map((log: any) => (
              <div
                key={log.id}
                className="flex items-center justify-between rounded-xl border border-portal-divider p-4"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-badge-gray-bg">
                    <Smartphone className="size-4 text-portal-icon" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-natural-100">
                      {log.user?.name ?? log.userId ?? "—"}
                    </p>
                    <p className="text-xs text-portal-note-text">
                      {log.user?.email ?? "—"}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Pill
                    tone={log.isRead ? "success" : "neutral"}
                  >
                    {log.isRead ? "مقروء" : "غير مقروء"}
                  </Pill>
                  <span className="text-xs text-portal-note-text">
                    {log.sentAt
                      ? new Date(log.sentAt).toLocaleString("ar-SA")
                      : "—"}
                  </span>
                  {log.readAt && (
                    <span className="text-xs text-portal-note-text">
                      قرئ: {new Date(log.readAt).toLocaleString("ar-SA")}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <EmptyState
            icon={ScrollText}
            title="لا توجد سجلات إرسال"
            hint="لم يتم إرسال هذا القالب بعد"
          />
        )}
      </Dialog>

      {/* Preview Dialog */}
      <Dialog
        open={showPreview}
        onOpenChange={setShowPreview}
        title="معاينة الإشعار"
        footer={
          <ActionButton variant="outline" onClick={() => setShowPreview(false)}>
            إغلاق
          </ActionButton>
        }
      >
        <div className="space-y-4">
          <div className="rounded-2xl border border-portal-divider p-4 space-y-3">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-secondary-100">
                <Bell className="size-5 text-secondary-600" />
              </div>
              <div>
                <p className="text-sm font-semibold text-natural-100">{broadcastForm.title || "(بدون عنوان)"}</p>
                <p className="text-xs text-portal-note-text">إشعار فوري</p>
              </div>
            </div>
            <p className="text-sm text-natural-100 leading-6 whitespace-pre-wrap">
              {broadcastForm.body || "(بدون محتوى)"}
            </p>
          </div>
          <div className="rounded-xl bg-badge-gray-bg p-3 text-xs text-portal-note-text">
            <p>سيتم إرسال هذا الإشعار إلى:
              {broadcastForm.recipientType === "all" && " جميع المستخدمين"}
              {broadcastForm.recipientType === "role" && ` دور: ${broadcastForm.recipientId || "غير محدد"}`}
              {broadcastForm.recipientType === "user" && ` المستخدم: ${broadcastForm.recipientId || "غير محدد"}`}
            </p>
          </div>
        </div>
      </Dialog>
    </div>
  );
}
