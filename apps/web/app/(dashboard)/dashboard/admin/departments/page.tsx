"use client";

import { useState } from "react";
import { Plus, Building2 } from "lucide-react";
import { toast } from "sonner";
import {
  useGetDepartmentsQuery,
  useCreateDepartmentMutation,
} from "@/features/departments/departmentsApi";
import { ActionButton } from "@/components/design-system/ActionButton";
import { SurfaceCard } from "@/components/design-system/SurfaceCard";
import { FormInputControl } from "@/components/design-system/FormInputControl";
import { Skeleton } from "@/components/design-system/Skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Dialog } from "@/components/design-system/Dialog";

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

  return (
    <div className="flex flex-col gap-6" dir="rtl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Building2 className="size-6 text-primary" />
          <h1 className="text-2xl font-semibold">إدارة الأقسام</h1>
        </div>
        <ActionButton onClick={() => setShowForm(true)}>
          <Plus className="size-4 mr-1" />
          قسم جديد
        </ActionButton>
      </div>

      {/* Create dialog */}
      {showForm && (
        <Dialog
          open
          onOpenChange={(open) => !open && setShowForm(false)}
          title="إضافة قسم جديد"
          footer={
            <div className="flex justify-end gap-3 pt-2">
              <ActionButton type="button" variant="outline" onClick={() => setShowForm(false)}>
                إلغاء
              </ActionButton>
              <ActionButton type="submit" form="dept-form" disabled={isCreating}>
                {isCreating ? "جارٍ الحفظ..." : "حفظ"}
              </ActionButton>
            </div>
          }
        >
          <form id="dept-form" onSubmit={handleSubmit} className="space-y-4">
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium">اسم القسم <span className="text-danger-500">*</span></label>
              <FormInputControl
                placeholder="مثال: التصميم، التطوير..."
                value={name}
                onChange={(e) => setName(e.target.value)}
                autoFocus
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium">الوصف</label>
              <FormInputControl
                placeholder="وصف مختصر للقسم..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>
          </form>
        </Dialog>
      )}

      {/* Table */}
      <SurfaceCard>
        {isLoading && (
          <div className="space-y-2">
            <div className="flex gap-6 px-4 py-3 bg-neutral-50/50">
            {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-4 w-24" />
              ))}
            </div>
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex gap-6 px-4 py-3 border-t">
                <Skeleton className="h-4 w-28" />
                <Skeleton className="h-4 w-56" />
                <Skeleton className="h-4 w-32" />
              </div>
            ))}
          </div>
        )}

        {isError && (
          <p className="text-sm text-danger-500 px-4 py-6 text-center">
            حدث خطأ أثناء تحميل الأقسام. يرجى تحديث الصفحة.
          </p>
        )}

        {!isLoading && !isError && departments && (
          <Table>
            <TableHeader>
              <TableRow className="bg-neutral-50/50">
                <TableHead className="text-right font-semibold">#</TableHead>
                <TableHead className="text-right font-semibold">اسم القسم</TableHead>
                <TableHead className="text-right font-semibold">الوصف</TableHead>
                <TableHead className="text-right font-semibold">تاريخ الإنشاء</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {departments.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-12 text-neutral-300">
                    <p className="text-lg font-medium">لا توجد أقسام</p>
                    <p className="text-sm mt-1">ابدأ بإضافة قسم جديد</p>
                  </TableCell>
                </TableRow>
              ) : (
                departments.map((dept, idx) => (
                  <TableRow key={dept.id} className="hover:bg-neutral-50/50">
                    <TableCell className="text-neutral-300 text-sm">{idx + 1}</TableCell>
                    <TableCell className="font-medium">{dept.name}</TableCell>
                    <TableCell className="text-neutral-300 text-sm max-w-xs truncate">
                      {dept.description ?? "—"}
                    </TableCell>
                    <TableCell dir="ltr" className="text-neutral-300 text-sm">
                      {new Date(dept.createdAt).toLocaleDateString("ar-SA")}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        )}
      </SurfaceCard>
    </div>
  );
}
