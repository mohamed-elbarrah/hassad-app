"use client";

import { useState, useCallback } from "react";
import { Wrench, Trash2, Pencil, Plus, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { ServiceCategory } from "@hassad/shared";
import {
  useGetServicesQuery,
  useCreateServiceMutation,
  useUpdateServiceMutation,
  useDeleteServiceMutation,
  type ServiceCatalogItem,
} from "@/features/services/servicesApi";
import { PageIntro } from "@/components/design-system/PageIntro";
import { DataTable } from "@/components/design-system/DataTable";
import { ActionButton } from "@/components/design-system/ActionButton";
import { FormInputControl } from "@/components/design-system/FormInputControl";
import { StatusBadge } from "@/components/design-system/StatusBadge";
import { Dialog } from "@/components/design-system/Dialog";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

interface ServiceFormData {
  name: string;
  nameAr: string;
  description: string;
  descriptionAr: string;
  isActive: boolean;
}

const DEFAULT_SERVICE_FORM: ServiceFormData = {
  name: "",
  nameAr: "",
  description: "",
  descriptionAr: "",
  isActive: true,
};

export default function ServicesAdminPage() {
  const { data: services, isLoading } = useGetServicesQuery({
    includeInactive: true,
  });
  const [createService, { isLoading: creating }] = useCreateServiceMutation();
  const [updateService, { isLoading: updating }] = useUpdateServiceMutation();
  const [deleteService] = useDeleteServiceMutation();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<ServiceFormData>(DEFAULT_SERVICE_FORM);
  const [errors, setErrors] = useState<
    Partial<Record<keyof ServiceFormData, string>>
  >({});

  const resetForm = useCallback(() => {
    setForm(DEFAULT_SERVICE_FORM);
    setEditingId(null);
    setErrors({});
  }, []);

  const openCreate = () => {
    resetForm();
    setDialogOpen(true);
  };
  const openEdit = (svc: ServiceCatalogItem) => {
    setForm({
      name: svc.name,
      nameAr: svc.nameAr,
      description: svc.description ?? "",
      descriptionAr: svc.descriptionAr ?? "",
      isActive: svc.isActive,
    });
    setEditingId(svc.id);
    setErrors({});
    setDialogOpen(true);
  };

  const validate = (): boolean => {
    const next: typeof errors = {};
    if (!form.name.trim()) next.name = "اسم الخدمة بالإنجليزية مطلوب";
    if (!form.nameAr.trim()) next.nameAr = "اسم الخدمة بالعربية مطلوب";
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    const payload: any = {
      name: form.name.trim(),
      nameAr: form.nameAr.trim(),
      description: form.description.trim() || undefined,
      descriptionAr: form.descriptionAr.trim() || undefined,
      category: ServiceCategory.OTHER,
      estimatedDays: 30,
      basePrice: 0,
      isActive: form.isActive,
      sortOrder: 0,
    };
    try {
      if (editingId) {
        await updateService({ id: editingId, body: payload }).unwrap();
        toast.success("تم تحديث الخدمة بنجاح");
      } else {
        await createService(payload).unwrap();
        toast.success("تم إضافة الخدمة بنجاح");
      }
      setDialogOpen(false);
      resetForm();
    } catch (err: any) {
      toast.error(err?.data?.message ?? "حدث خطأ أثناء حفظ الخدمة");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("هل أنت متأكد من حذف هذه الخدمة؟ سيتم تعطيلها.")) return;
    try {
      await deleteService(id).unwrap();
      toast.success("تم تعطيل الخدمة");
    } catch {
      toast.error("تعذر حذف الخدمة");
    }
  };

  const svcList = services ?? [];

  return (
    <div className="flex flex-col gap-6" dir="rtl">
      <PageIntro
        title="إدارة الخدمات"
        description="إنشاء وتعديل وتعطيل خدمات الكتالوج المعروضة للعملاء"
        icon={Wrench}
        actions={
          <ActionButton onClick={openCreate}>
            <Plus className="size-4 mr-1" />
            إضافة خدمة
          </ActionButton>
        }
      />

      <DataTable
        columns={[
          { id: "nameAr", label: "الاسم (عربي)" },
          { id: "name", label: "الاسم (EN)" },
          { id: "status", label: "الحالة" },
          { id: "actions", label: "", width: "80px" },
        ]}
        data={svcList}
        isLoading={isLoading}
        isError={false}
        emptyState={{
          icon: Wrench,
          message: "لا توجد خدمات",
          hint: "أضف أول خدمة إلى الكتالوج",
        }}
        renderRow={(svc) => (
          <tr key={svc.id} className="border-b-[1.5px] border-portal-divider">
            <td className="px-5 py-4 text-base font-semibold text-natural-100">
              {svc.nameAr}
            </td>
            <td className="px-5 py-4 text-base text-natural-100">{svc.name}</td>
            <td className="px-5 py-4">
              <StatusBadge
                status={svc.isActive ? "ACTIVE" : "STOPPED"}
                label={svc.isActive ? "نشط" : "معطل"}
              />
            </td>
            <td className="px-5 py-4">
              <div className="flex items-center gap-0.5">
                <ActionButton
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 text-portal-icon hover:text-natural-100"
                  onClick={() => openEdit(svc)}
                >
                  <Pencil className="size-4" />
                </ActionButton>
                <ActionButton
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 text-portal-icon hover:text-danger-500"
                  onClick={() => handleDelete(svc.id)}
                >
                  <Trash2 className="size-4" />
                </ActionButton>
              </div>
            </td>
          </tr>
        )}
      />

      <Dialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        title={editingId ? "تعديل الخدمة" : "إضافة خدمة جديدة"}
        description={
          editingId
            ? "عدّل بيانات الخدمة الحالية."
            : "أضف خدمة جديدة إلى كتالوج الخدمات."
        }
        contentClassName="sm:max-w-xl"
      >
        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <Label className="text-sm font-medium text-natural-100">
                اسم الخدمة (عربي) <span className="text-danger-500">*</span>
              </Label>
              <FormInputControl
                placeholder="الهوية البصرية"
                value={form.nameAr}
                onChange={(e) =>
                  setForm((f) => ({ ...f, nameAr: e.target.value }))
                }
                onBlur={() => setErrors((e) => ({ ...e, nameAr: undefined }))}
                className={cn(
                  errors.nameAr &&
                    "border-danger-500 focus-visible:ring-danger-500",
                )}
                required
              />
              {errors.nameAr && (
                <span className="text-xs text-danger-500 flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  {errors.nameAr}
                </span>
              )}
            </div>
            <div className="flex flex-col gap-1.5">
              <Label className="text-sm font-medium text-natural-100">
                اسم الخدمة (إنجليزي) <span className="text-danger-500">*</span>
              </Label>
              <FormInputControl
                placeholder="Brand Identity"
                value={form.name}
                onChange={(e) =>
                  setForm((f) => ({ ...f, name: e.target.value }))
                }
                onBlur={() => setErrors((e) => ({ ...e, name: undefined }))}
                className={cn(
                  errors.name &&
                    "border-danger-500 focus-visible:ring-danger-500",
                )}
                required
              />
              {errors.name && (
                <span className="text-xs text-danger-500 flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  {errors.name}
                </span>
              )}
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label className="text-sm font-medium text-natural-100">
              وصف الخدمة (عربي)
            </Label>
            <FormInputControl
              placeholder="وصف مختصر للخدمة بالعربية"
              value={form.descriptionAr}
              onChange={(e) =>
                setForm((f) => ({ ...f, descriptionAr: e.target.value }))
              }
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label className="text-sm font-medium text-natural-100">
              وصف الخدمة (إنجليزي)
            </Label>
            <FormInputControl
              placeholder="Brief description in English"
              value={form.description}
              onChange={(e) =>
                setForm((f) => ({ ...f, description: e.target.value }))
              }
            />
          </div>

          <label className="flex items-center gap-2.5 cursor-pointer select-none group">
            <div
              className={cn(
                "w-11 h-6 rounded-full relative transition-colors",
                form.isActive ? "bg-success-500" : "bg-neutral-200",
              )}
              onClick={() => setForm((f) => ({ ...f, isActive: !f.isActive }))}
            >
              <div
                className={cn(
                  "absolute top-0.5 left-0.5 h-5 w-5 bg-white rounded-full shadow-sm transition-transform duration-200",
                  form.isActive ? "translate-x-5" : "",
                )}
              />
            </div>
            <span className="text-sm font-medium text-natural-100">نشطة</span>
          </label>

          <div className="flex gap-2 justify-end mt-1 border-t pt-4">
            <ActionButton
              variant="ghost"
              onClick={() => {
                setDialogOpen(false);
                resetForm();
              }}
            >
              إلغاء
            </ActionButton>
            <ActionButton
              type="submit"
              disabled={creating || updating}
              className="min-w-[120px]"
            >
              {creating || updating
                ? "جارٍ الحفظ..."
                : editingId
                  ? "حفظ التعديلات"
                  : "إضافة الخدمة"}
            </ActionButton>
          </div>
        </form>
      </Dialog>
    </div>
  );
}
