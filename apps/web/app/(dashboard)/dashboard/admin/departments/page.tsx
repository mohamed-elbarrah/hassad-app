"use client";

import { useState } from "react";
import { Plus, Building2, Pencil, Trash2, Users, UserCheck, AlertCircle, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { formatDate } from "@/lib/format";
import {
  useGetDepartmentsQuery,
  useCreateDepartmentMutation,
  useUpdateDepartmentMutation,
  useDeleteDepartmentMutation,
} from "@/features/departments/departmentsApi";
import { useSearchAdminUsersQuery } from "@/features/admin/adminApi";
import { PageIntro } from "@/components/design-system/PageIntro";
import { DataTable } from "@/components/design-system/DataTable";
import { ActionButton } from "@/components/design-system/ActionButton";
import { FormInputControl } from "@/components/design-system/FormInputControl";
import { Dialog } from "@/components/design-system/Dialog";
import { Pill } from "@/components/design-system/Pill";
import { Label } from "@/components/ui/label";

export default function DepartmentsPage() {
  const { data: departments, isLoading, isError } = useGetDepartmentsQuery();
  const [createDept, { isLoading: isCreating }] = useCreateDepartmentMutation();
  const [updateDept, { isLoading: isUpdating }] = useUpdateDepartmentMutation();
  const [deleteDept] = useDeleteDepartmentMutation();
  const { data: pmUsers } = useSearchAdminUsersQuery({ excludeRole: "client", limit: 100 });

  const [showForm, setShowForm] = useState(false);
  const [editingDept, setEditingDept] = useState<any>(null);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [managerId, setManagerId] = useState("");

  const pmList = pmUsers?.items ?? [];

  const openCreate = () => {
    setEditingDept(null);
    setName("");
    setDescription("");
    setManagerId("");
    setShowForm(true);
  };

  const openEdit = (dept: any) => {
    setEditingDept(dept);
    setName(dept.name);
    setDescription(dept.description ?? "");
    setManagerId(dept.managerId ?? "");
    setShowForm(true);
  };

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) {
      toast.error("اسم القسم مطلوب");
      return;
    }
    try {
      const payload = {
        name: name.trim(),
        description: description.trim() || undefined,
        managerId: managerId || undefined,
      };
      if (editingDept) {
        await updateDept({ id: editingDept.id, body: payload }).unwrap();
        toast.success("تم تحديث القسم بنجاح");
      } else {
        await createDept(payload).unwrap();
        toast.success("تم إنشاء القسم بنجاح");
      }
      setShowForm(false);
    } catch {
      toast.error(editingDept ? "فشل تحديث القسم" : "فشل إنشاء القسم. قد يكون الاسم مستخدماً بالفعل.");
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm("هل أنت متأكد من حذف هذا القسم؟")) return;
    try {
      await deleteDept(id).unwrap();
      toast.success("تم حذف القسم");
    } catch {
      toast.error("فشل حذف القسم");
    }
  };

  const deptList = departments ?? [];
  const maxWorkload = Math.max(1, ...deptList.map((d: any) => d._count?.activeRequests ?? 0));

  return (
    <div className="flex flex-col gap-6" dir="rtl">
      <PageIntro
        title="إدارة الأقسام"
        description="تنظيم الأقسام الوظيفية في المنصة"
        icon={Building2}
        actions={
          <ActionButton onClick={openCreate}>
            <Plus className="size-4 mr-1" />
            قسم جديد
          </ActionButton>
        }
      />

      {/* Workload Summary */}
      <div className="grid grid-cols-1 gap-3">
        <h3 className="text-sm font-semibold text-natural-100 flex items-center gap-2">
          <AlertCircle className="size-4 text-secondary-500" />
          ملخص عبء العمل
        </h3>
        {deptList.map((dept: any) => {
          const workload = dept._count?.activeRequests ?? 0;
          const pct = maxWorkload > 0 ? (workload / maxWorkload) * 100 : 0;
          return (
            <div key={dept.id} className="flex items-center gap-3">
              <span className="text-sm text-natural-100 w-40 truncate">{dept.name}</span>
              <div className="flex-1 h-2.5 rounded-full bg-neutral-100 overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${pct}%`,
                    backgroundColor: pct > 70 ? "#ef4444" : pct > 40 ? "#f59e0b" : "#22c55e",
                  }}
                />
              </div>
              <span className="text-xs text-portal-note-text w-16 text-left">{workload} طلب</span>
            </div>
          );
        })}
      </div>

      <DataTable
        columns={[
          { id: "index", label: "#", width: "60px" },
          { id: "name", label: "اسم القسم" },
          { id: "manager", label: "مدير القسم" },
          { id: "members", label: "عدد الأعضاء" },
          { id: "description", label: "الوصف" },
          { id: "createdAt", label: "تاريخ الإنشاء", align: "left" },
          { id: "actions", label: "", width: "100px", align: "left" },
        ]}
        data={deptList}
        isLoading={isLoading}
        isError={isError}
        errorMessage="حدث خطأ أثناء تحميل الأقسام. يرجى تحديث الصفحة."
        emptyState={{
          icon: Building2,
          message: "لا توجد أقسام",
          hint: "ابدأ بإضافة قسم جديد",
        }}
        renderRow={(dept, idx) => (
          <tr key={dept.id} className="border-b-[1.5px] border-portal-divider">
            <td className="px-5 py-4 text-sm text-portal-note-text">{idx + 1}</td>
            <td className="px-5 py-4 text-base font-medium text-natural-100">{dept.name}</td>
            <td className="px-5 py-4 text-sm">
              {dept.managerName ? (
                <div className="flex items-center gap-1.5">
                  <UserCheck className="size-3.5 text-secondary-500" />
                  <span>{dept.managerName}</span>
                </div>
              ) : (
                <span className="text-portal-note-text">—</span>
              )}
            </td>
            <td className="px-5 py-4">
              <div className="flex items-center gap-1.5">
                <Users className="size-3.5 text-portal-note-text" />
                <Pill tone="neutral">{dept._count?.members ?? 0}</Pill>
              </div>
            </td>
            <td className="px-5 py-4 text-sm text-portal-note-text max-w-xs truncate">
              {dept.description ?? "—"}
            </td>
            <td className="px-5 py-4 text-sm text-portal-note-text text-left" dir="ltr">
              {formatDate(dept.createdAt)}
            </td>
            <td className="px-5 py-4 text-left">
              <div className="flex items-center gap-1">
                <ActionButton
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8"
                  onClick={() => openEdit(dept)}
                  title="تعديل"
                >
                  <Pencil className="size-3.5" />
                </ActionButton>
                <ActionButton
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 text-portal-icon hover:text-danger-500"
                  onClick={() => handleDelete(dept.id)}
                  title="حذف"
                >
                  <Trash2 className="size-3.5" />
                </ActionButton>
              </div>
            </td>
          </tr>
        )}
      />

      {/* Create/Edit dialog */}
      <Dialog
        open={showForm}
        onOpenChange={(open) => !open && setShowForm(false)}
        title={editingDept ? "تعديل القسم" : "إضافة قسم جديد"}
        description={editingDept ? "عدّل بيانات القسم" : "أدخل اسم القسم ووصفه"}
        contentClassName="sm:max-w-md"
        footer={
          <div className="flex justify-end gap-3 pt-2">
            <ActionButton variant="outline" onClick={() => setShowForm(false)}>
              إلغاء
            </ActionButton>
            <ActionButton type="submit" form="dept-form" disabled={isCreating || isUpdating}>
              {isCreating || isUpdating ? (
                <><Loader2 className="size-4 animate-spin ml-1" />جارٍ الحفظ...</>
              ) : (
                editingDept ? "حفظ التغييرات" : "حفظ"
              )}
            </ActionButton>
          </div>
        }
      >
        <form id="dept-form" onSubmit={handleSubmit} className="space-y-4">
          <div className="flex flex-col gap-1.5">
            <Label className="text-sm font-medium text-natural-100">
              اسم القسم <span className="text-danger-500">*</span>
            </Label>
            <FormInputControl
              placeholder="مثال: التصميم، التطوير..."
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoFocus
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label className="text-sm font-medium text-natural-100">مدير القسم</Label>
            <select
              value={managerId}
              onChange={(e) => setManagerId(e.target.value)}
              className="w-full rounded-xl border border-portal-divider px-4 py-2.5 text-sm bg-white"
            >
              <option value="">اختر مديراً...</option>
              {pmList.map((u: any) => (
                <option key={u.id} value={u.id}>
                  {u.name} ({u.role})
                </option>
              ))}
            </select>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label className="text-sm font-medium text-natural-100">الوصف</Label>
            <FormInputControl
              placeholder="وصف مختصر للقسم..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>
        </form>
      </Dialog>
    </div>
  );
}
