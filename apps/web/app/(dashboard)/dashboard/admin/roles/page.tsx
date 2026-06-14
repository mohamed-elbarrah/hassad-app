"use client";

import { useState } from "react";
import { Shield, Plus, Pencil, Info } from "lucide-react";
import { toast } from "sonner";
import { useGetRolesQuery, useCreateRoleMutation, useUpdateRoleMutation, useAssignPermissionsMutation } from "@/features/roles/rolesApi";
import { useGetPermissionsQuery } from "@/features/permissions/permissionsApi";
import { PageIntro } from "@/components/design-system/PageIntro";
import { DataTable } from "@/components/design-system/DataTable";
import { ActionButton } from "@/components/design-system/ActionButton";
import { FormInputControl } from "@/components/design-system/FormInputControl";
import { StatusBanner } from "@/components/design-system/StatusBanner";
import { Dialog } from "@/components/design-system/Dialog";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/design-system/Checkbox";
import { Pill } from "@/components/design-system/Pill";

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
        الصلاحيات الممنوحة للدور تنطبق على جميع المستخدمين المنتمين له. يمكنك أيضاً منح صلاحيات إضافية لمستخدم محدد من صفحة إدارة الموظفين.
      </StatusBanner>

      <DataTable
        columns={[
          { id: "name", label: "الدور" },
          { id: "users", label: "المستخدمين" },
          { id: "permissions", label: "الصلاحيات" },
          { id: "actions", label: "الإجراءات", width: "120px" },
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
                    {p.permission.name}
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
          if (!open) { setEditRole(null); setNewRoleName(""); }
        }}
        title={editRole ? "تعديل اسم الدور" : "إنشاء دور جديد"}
        description={editRole ? "عدّل اسم الدور الحالي" : "أنشئ دوراً جديداً في النظام"}
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
            <ActionButton variant="outline" onClick={() => { setCreateOpen(false); setEditRole(null); setNewRoleName(""); }}>
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
            <ActionButton variant="outline" onClick={() => setPermDialogOpen(false)}>
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
              <div key={module} className="border border-portal-card-border rounded-2xl p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Checkbox
                      id={`module-${module}`}
                      checked={allSelected}
                      onCheckedChange={() => toggleAllModule(perms)}
                    />
                    <Label htmlFor={`module-${module}`} className="font-bold text-base capitalize cursor-pointer text-natural-100">
                      {module}
                    </Label>
                  </div>
                  <span className="text-sm text-portal-note-text">{perms.length}</span>
                </div>
                <div className="grid grid-cols-2 gap-1.5 mr-6">
                  {perms.map((p) => (
                    <label key={p.id} className="flex items-center gap-2 text-sm cursor-pointer hover:bg-badge-gray-bg rounded-lg px-2 py-1">
                      <Checkbox
                        checked={selectedPerms.has(p.id)}
                        onCheckedChange={() => togglePerm(p.id)}
                      />
                      <span className="text-sm text-portal-icon">{p.name}</span>
                    </label>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </Dialog>
    </div>
  );
}
