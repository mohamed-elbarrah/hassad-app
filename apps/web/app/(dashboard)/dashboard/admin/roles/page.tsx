"use client";

import { useState } from "react";
import { Shield, Plus, Pencil, Info, Copy, History } from "lucide-react";
import { toast } from "sonner";
import {
  useGetRolesQuery,
  useCreateRoleMutation,
  useUpdateRoleMutation,
  useAssignPermissionsMutation,
} from "@/features/roles/rolesApi";
import { useGetPermissionsQuery } from "@/features/permissions/permissionsApi";
import { PageIntro } from "@/components/design-system/PageIntro";
import { DataTable } from "@/components/design-system/DataTable";
import { ActionButton } from "@/components/design-system/ActionButton";
import { FormInputControl } from "@/components/design-system/FormInputControl";
import { StatusBanner } from "@/components/design-system/StatusBanner";
import { Dialog } from "@/components/design-system/Dialog";
import { EmptyState } from "@/components/design-system/EmptyState";
import { TimelineItem } from "@/components/design-system/Timeline";
import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from "@/components/design-system/Tabs";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/design-system/Checkbox";
import { Pill } from "@/components/design-system/Pill";

const PERMISSION_ARABIC_LABELS: Record<string, string> = {
  // ── Modules ──
  admin: "الإدارة",
  finance: "المالية",
  projects: "المشاريع",
  tasks: "المهام",
  clients: "العملاء",
  leads: "العملاء المحتملين",
  contracts: "العقود",
  proposals: "العروض",
  marketing: "التسويق",
  chat: "المحادثات",
  notifications: "الإشعارات",
  portal: "بوابة العميل",
  reports: "التقارير",
  sales: "المبيعات",
  other: "أخرى",
  // ── Admin ──
  "admin.users": "إدارة المستخدمين",
  "admin.users.create": "إنشاء مستخدمين",
  "admin.settings": "الإعدادات",
  "admin.audit": "سجل النشاطات",
  "admin.dashboard": "لوحة التحكم",
  "admin.reports": "التقارير",
  "admin.projects": "إدارة المشاريع",
  "admin.projects.intervene": "التدخل في المشاريع",
  "admin.tasks": "إدارة المهام",
  "admin.tasks.force": "فرض حالة المهام",
  "admin.contracts": "إدارة العقود",
  "admin.contracts.cancel": "إلغاء العقود",
  "admin.leads": "إدارة العملاء المحتملين",
  "admin.leads.reassign": "إعادة تعيين العملاء المحتملين",
  "admin.requests": "إدارة الطلبات",
  "admin.requests.force": "فرض حالة الطلبات",
  "admin.campaigns": "إدارة الحملات",
  "admin.campaigns.manage": "إدارة الحملات",
  "admin.clients": "إدارة العملاء",
  "admin.portal": "إدارة البوابة",
  "admin.portal.manage": "إدارة بوابة العميل",
  "admin.notifications": "الإشعارات",
  "admin.marketing": "التسويق",
  "admin.team": "أداء الفريق",
  "admin.security": "الأمان",
  "admin.conversations.hide": "إخفاء المحادثات",
  "admin.impersonate": "انتحال الشخصية",
  "admin.backup": "النسخ الاحتياطي",
  "admin.finance.read": "قراءة المالية (إدارة)",
  "admin.finance.intervene": "التدخل في المالية",
  // ── Finance ──
  "finance.read": "قراءة المالية",
  "finance.write": "كتابة المالية",
  "finance.invoices.create": "إنشاء الفواتير",
  "finance.invoices.edit": "تعديل الفواتير",
  "finance.invoices.delete": "حذف الفواتير",
  "finance.payments.register": "تسجيل المدفوعات",
  "finance.payments.refund": "استرداد المدفوعات",
  "finance.reports": "التقارير المالية",
  // ── Projects ──
  "projects.read": "قراءة المشاريع",
  "projects.write": "كتابة المشاريع",
  "projects.create": "إنشاء المشاريع",
  "projects.edit": "تعديل المشاريع",
  "projects.delete": "حذف المشاريع",
  // ── Tasks ──
  "tasks.read": "قراءة المهام",
  "tasks.write": "كتابة المهام",
  "tasks.create": "إنشاء المهام",
  "tasks.edit": "تعديل المهام",
  "tasks.delete": "حذف المهام",
  "tasks.assign": "تعيين المهام",
  // ── Clients ──
  "clients.read": "قراءة العملاء",
  "clients.write": "كتابة العملاء",
  "clients.create": "إنشاء العملاء",
  "clients.edit": "تعديل العملاء",
  // ── Leads ──
  "leads.read": "قراءة العملاء المحتملين",
  "leads.create": "إنشاء العملاء المحتملين",
  "leads.edit": "تعديل العملاء المحتملين",
  // ── Contracts ──
  "contracts.read": "قراءة العقود",
  "contracts.create": "إنشاء العقود",
  "contracts.edit": "تعديل العقود",
  // ── Proposals ──
  "proposals.read": "قراءة العروض",
  "proposals.create": "إنشاء العروض",
  "proposals.edit": "تعديل العروض",
  // ── Marketing ──
  "marketing.campaigns": "إدارة الحملات التسويقية",
  // ── Chat ──
  "chat.read": "قراءة المحادثات",
  "chat.send": "إرسال الرسائل",
  // ── Notifications ──
  "notifications.send": "إرسال الإشعارات",
  // ── Portal ──
  "portal.access": "الوصول إلى بوابة العميل",
  // ── Reports ──
  "reports.read": "قراءة التقارير",
  "reports.export": "تصدير التقارير",
  // ── Sales ──
  "sales.read": "قراءة المبيعات",
  "sales.write": "كتابة المبيعات",
};

function getArabicLabel(name: string): string {
  return PERMISSION_ARABIC_LABELS[name] ?? name;
}

interface RoleWithPermissions {
  id: string;
  name: string;
  permissions: Array<{
    permissionId: string;
    permission: { id: string; name: string };
  }>;
  _count?: { users: number };
}

interface Permission {
  id: string;
  name: string;
}

function groupPermissions(permissions: Permission[]) {
  const groups: Record<string, Permission[]> = {};
  for (const p of permissions) {
    const module = p.name.split(".")[0] || "other";
    if (!groups[module]) groups[module] = [];
    groups[module].push(p);
  }
  return groups;
}

const MOCK_HISTORY = [
  { action: "تم تعديل الصلاحيات", user: "أحمد علي", date: "2025-12-20", details: "إضافة صلاحية admin.users" },
  { action: "تم تغيير الاسم", user: "أحمد علي", date: "2025-11-15", details: "تغيير الاسم من مدير إلى مشرف" },
  { action: "تم إنشاء الدور", user: "محمد سالم", date: "2025-10-01", details: "إنشاء دور جديد" },
];

export default function RolesPage() {
  const { data: roles, isLoading: rolesLoading } = useGetRolesQuery();
  const { data: permissions, isLoading: permsLoading } = useGetPermissionsQuery();
  const [createRole] = useCreateRoleMutation();
  const [updateRole] = useUpdateRoleMutation();
  const [assignPerms] = useAssignPermissionsMutation();

  const [createOpen, setCreateOpen] = useState(false);
  const [editRole, setEditRole] = useState<RoleWithPermissions | null>(null);
  const [permDialogOpen, setPermDialogOpen] = useState(false);
  const [permRole, setPermRole] = useState<RoleWithPermissions | null>(null);
  const [selectedPerms, setSelectedPerms] = useState<Set<string>>(new Set());
  const [newRoleName, setNewRoleName] = useState("");
  const [showHistory, setShowHistory] = useState<RoleWithPermissions | null>(null);

  const isLoading = rolesLoading || permsLoading;
  const permissionGroups = permissions ? groupPermissions(permissions) : {};
  const roleList = (roles ?? []) as RoleWithPermissions[];

  const openPermDialog = (role: RoleWithPermissions) => {
    setPermRole(role);
    setSelectedPerms(new Set(role.permissions.map((p) => p.permissionId)));
    setPermDialogOpen(true);
  };

  const handleSavePermissions = async () => {
    if (!permRole) return;
    try {
      await assignPerms({
        roleId: permRole.id,
        permissionIds: Array.from(selectedPerms),
      }).unwrap();
      toast.success("تم حفظ الصلاحيات بنجاح");
      setPermDialogOpen(false);
    } catch {
      toast.error("فشل حفظ الصلاحيات");
    }
  };

  const handleCreate = async () => {
    if (!newRoleName.trim()) return;
    try {
      await createRole({ name: newRoleName.trim() }).unwrap();
      toast.success("تم إنشاء الدور بنجاح");
      setNewRoleName("");
      setCreateOpen(false);
    } catch {
      toast.error("فشل إنشاء الدور");
    }
  };

  const handleUpdate = async () => {
    if (!editRole || !newRoleName.trim()) return;
    try {
      await updateRole({ id: editRole.id, name: newRoleName.trim() }).unwrap();
      toast.success("تم تحديث الدور");
      setCreateOpen(false);
      setEditRole(null);
      setNewRoleName("");
    } catch {
      toast.error("فشل تحديث الدور");
    }
  };

  const handleClone = async (role: RoleWithPermissions) => {
    try {
      await createRole({ name: `${role.name} - نسخة` }).unwrap();
      toast.success("تم استنساخ الدور بنجاح");
    } catch {
      toast.error("فشل استنساخ الدور");
    }
  };

  const togglePerm = (permId: string) => {
    setSelectedPerms((prev) => {
      const next = new Set(prev);
      if (next.has(permId)) next.delete(permId);
      else next.add(permId);
      return next;
    });
  };

  const toggleAllModule = (modulePerms: Permission[]) => {
    const allSelected = modulePerms.every((p) => selectedPerms.has(p.id));
    setSelectedPerms((prev) => {
      const next = new Set(prev);
      for (const p of modulePerms) {
        if (allSelected) next.delete(p.id);
        else next.add(p.id);
      }
      return next;
    });
  };

  return (
    <div className="flex flex-col gap-6" dir="rtl">
      <PageIntro
        title="الأدوار والصلاحيات"
        description="إدارة الأدوار وتوزيع الصلاحيات على مستخدمي المنصة"
        icon={Shield}
        actions={
          <ActionButton onClick={() => setCreateOpen(true)}>
            <Plus className="size-4 mr-1" />
            دور جديد
          </ActionButton>
        }
      />

      <StatusBanner variant="warning" icon={Info}>
        الصلاحيات الممنوحة للدور تنطبق على جميع المستخدمين المنتمين له. يمكنك
        أيضاً منح صلاحيات إضافية لمستخدم محدد من صفحة إدارة الموظفين.
      </StatusBanner>

      <DataTable
        columns={[
          { id: "name", label: "الدور" },
          { id: "users", label: "المستخدمين" },
          { id: "permissions", label: "الصلاحيات" },
          { id: "actions", label: "الإجراءات", width: "180px" },
        ]}
        data={roleList}
        isLoading={isLoading}
        isError={false}
        emptyState={{
          icon: Shield,
          message: "لا توجد أدوار",
          hint: "ابدأ بإنشاء أول دور في النظام",
        }}
        renderRow={(role) => (
          <tr key={role.id} className="border-b-[1.5px] border-portal-divider">
            <td className="px-5 py-4 text-base font-semibold text-natural-100">
              {role.name}
            </td>
            <td className="px-5 py-4">
              <Pill tone="neutral">{role._count?.users ?? 0}</Pill>
            </td>
            <td className="px-5 py-4">
              <div className="flex flex-wrap gap-1">
                {role.permissions.slice(0, 4).map((p) => (
                  <Pill key={p.permissionId} tone="blue" className="text-[10px]">
                    {getArabicLabel(p.permission.name)}
                  </Pill>
                ))}
                {role.permissions.length > 4 && (
                  <Pill tone="neutral" className="text-[10px]">
                    +{role.permissions.length - 4}
                  </Pill>
                )}
              </div>
            </td>
            <td className="px-5 py-4">
              <div className="flex items-center gap-1">
                <ActionButton
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8"
                  onClick={() => openPermDialog(role)}
                  title="تعديل الصلاحيات"
                >
                  <Shield className="size-3.5" />
                </ActionButton>
                <ActionButton
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8"
                  onClick={() => {
                    setEditRole(role);
                    setNewRoleName(role.name);
                    setCreateOpen(true);
                  }}
                  title="تعديل الاسم"
                >
                  <Pencil className="size-3.5" />
                </ActionButton>
                <ActionButton
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8"
                  onClick={() => handleClone(role)}
                  title="استنساخ الدور"
                >
                  <Copy className="size-3.5" />
                </ActionButton>
                <ActionButton
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8"
                  onClick={() => setShowHistory(role)}
                  title="سجل التغييرات"
                >
                  <History className="size-3.5" />
                </ActionButton>
              </div>
            </td>
          </tr>
        )}
      />

      {/* Create/Edit Role Dialog */}
      <Dialog
        open={createOpen}
        onOpenChange={(open) => {
          setCreateOpen(open);
          if (!open) {
            setEditRole(null);
            setNewRoleName("");
          }
        }}
        title={editRole ? "تعديل اسم الدور" : "إنشاء دور جديد"}
        description={
          editRole ? "عدّل اسم الدور الحالي" : "أنشئ دوراً جديداً في النظام"
        }
        contentClassName="sm:max-w-md"
      >
        <div className="space-y-4">
          <div className="flex flex-col gap-1.5">
            <Label className="text-sm font-medium">اسم الدور</Label>
            <FormInputControl
              placeholder="مثال: مدير تنفيذي"
              value={newRoleName}
              onChange={(e) => setNewRoleName(e.target.value)}
              autoFocus
            />
          </div>
          <div className="flex gap-2 justify-end">
            <ActionButton
              variant="outline"
              onClick={() => {
                setCreateOpen(false);
                setEditRole(null);
                setNewRoleName("");
              }}
            >
              إلغاء
            </ActionButton>
            <ActionButton onClick={editRole ? handleUpdate : handleCreate}>
              {editRole ? "حفظ" : "إنشاء"}
            </ActionButton>
          </div>
        </div>
      </Dialog>

      {/* Permissions Dialog */}
      <Dialog
        open={permDialogOpen}
        onOpenChange={setPermDialogOpen}
        title={`صلاحيات دور: ${permRole?.name ?? ""}`}
        description="حدد الصلاحيات الممنوحة لهذا الدور"
        contentClassName="sm:max-w-2xl max-h-[80vh] overflow-y-auto"
        footer={
          <div className="flex gap-2 justify-end pt-4 border-t">
            <ActionButton
              variant="outline"
              onClick={() => setPermDialogOpen(false)}
            >
              إلغاء
            </ActionButton>
            <ActionButton onClick={handleSavePermissions}>
              حفظ الصلاحيات
            </ActionButton>
          </div>
        }
      >
        <div className="space-y-6">
          {Object.entries(permissionGroups).map(([module, perms]) => {
            const allSelected = perms.every((p) => selectedPerms.has(p.id));
            return (
              <div
                key={module}
                className="border border-portal-card-border rounded-2xl p-4"
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Checkbox
                      id={`module-${module}`}
                      checked={allSelected}
                      onCheckedChange={() => toggleAllModule(perms)}
                    />
                    <Label
                      htmlFor={`module-${module}`}
                      className="font-bold text-base cursor-pointer text-natural-100"
                    >
                      {getArabicLabel(module)}
                    </Label>
                  </div>
                  <span className="text-sm text-portal-note-text">
                    {perms.length}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-1.5 mr-6">
                  {perms.map((p) => (
                    <label
                      key={p.id}
                      className="flex items-center gap-2 text-sm cursor-pointer hover:bg-badge-gray-bg rounded-lg px-2 py-1"
                    >
                      <Checkbox
                        checked={selectedPerms.has(p.id)}
                        onCheckedChange={() => togglePerm(p.id)}
                      />
                      <span className="text-sm text-portal-icon">
                        {getArabicLabel(p.name)}
                      </span>
                    </label>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </Dialog>

      {/* History Dialog */}
      <Dialog
        open={!!showHistory}
        onOpenChange={(open) => !open && setShowHistory(null)}
        title={`سجل تغييرات: ${showHistory?.name ?? ""}`}
        contentClassName="sm:max-w-lg"
      >
        <div className="space-y-4">
          {MOCK_HISTORY.length === 0 ? (
            <EmptyState icon={History} title="لا توجد تغييرات مسجلة" />
          ) : (
            MOCK_HISTORY.map((entry, i) => (
              <TimelineItem
                key={i}
                title={entry.action}
                description={entry.details}
                timestamp={`${entry.user} · ${entry.date}`}
                icon={<History className="size-3.5 text-white" />}
                isLast={i === MOCK_HISTORY.length - 1}
              />
            ))
          )}
        </div>
      </Dialog>
    </div>
  );
}
