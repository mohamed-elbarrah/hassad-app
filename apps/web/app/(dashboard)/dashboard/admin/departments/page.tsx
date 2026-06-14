"use client";

import { useState } from "react";
import { Plus, Building2 } from "lucide-react";
import { toast } from "sonner";
import { formatDate } from "@/lib/format";
import {
  useGetDepartmentsQuery,
  useCreateDepartmentMutation,
} from "@/features/departments/departmentsApi";
import { PageIntro } from "@/components/design-system/PageIntro";
import { DataTable } from "@/components/design-system/DataTable";
import { ActionButton } from "@/components/design-system/ActionButton";
import { FormInputControl } from "@/components/design-system/FormInputControl";
import { Dialog } from "@/components/design-system/Dialog";
import { Label } from "@/components/ui/label";

export default function DepartmentsPage() {
  const { data: departments, isLoading, isError } = useGetDepartmentsQuery();
  const [createDept, { isLoading: isCreating }] = useCreateDepartmentMutation();

  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) {
      toast.error("اسم القسم مطلوب");
      return;
    }
    try {
      await createDept({ name: name.trim(), description: description.trim() || undefined }).unwrap();
      toast.success("تم إنشاء القسم بنجاح");
      setName("");
      setDescription("");
      setShowForm(false);
    } catch {
      toast.error("فشل إنشاء القسم. قد يكون الاسم مستخدماً بالفعل.");
    }
  }

  const deptList = departments ?? [];

  return (
    <div className="flex flex-col gap-6" dir="rtl">
      <PageIntro
        title="إدارة الأقسام"
        description="تنظيم الأقسام الوظيفية في المنصة"
        icon={Building2}
        actions={
          <ActionButton onClick={() => setShowForm(true)}>
            <Plus className="size-4 mr-1" />
            قسم جديد
          </ActionButton>
        }
      />

      <DataTable
        columns={[
          { id: "index", label: "#", width: "60px" },
          { id: "name", label: "اسم القسم" },
          { id: "description", label: "الوصف" },
          { id: "createdAt", label: "تاريخ الإنشاء", align: "left" },
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
            <td className="px-5 py-4 text-sm text-portal-note-text max-w-xs truncate">
              {dept.description ?? "—"}
            </td>
            <td className="px-5 py-4 text-sm text-portal-note-text text-left" dir="ltr">
              {formatDate(dept.createdAt)}
            </td>
          </tr>
        )}
      />

      {/* Create dialog */}
      <Dialog
        open={showForm}
        onOpenChange={(open) => !open && setShowForm(false)}
        title="إضافة قسم جديد"
        description="أدخل اسم القسم ووصفه"
        contentClassName="sm:max-w-md"
        footer={
          <div className="flex justify-end gap-3 pt-2">
            <ActionButton variant="outline" onClick={() => setShowForm(false)}>
              إلغاء
            </ActionButton>
            <ActionButton type="submit" form="dept-form" disabled={isCreating}>
              {isCreating ? "جارٍ الحفظ..." : "حفظ"}
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
