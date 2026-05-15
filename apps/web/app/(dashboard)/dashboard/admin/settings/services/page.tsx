"use client";

import { useState, useCallback } from "react";
import {
  Wrench,
  Trash2,
  Pencil,
  Plus,
  AlertCircle,
} from "lucide-react";
import { toast } from "sonner";
import { ServiceCategory } from "@hassad/shared";
import {
  useGetServicesQuery,
  useCreateServiceMutation,
  useUpdateServiceMutation,
  useDeleteServiceMutation,
  type ServiceCatalogItem,
} from "@/features/services/servicesApi";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
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
  const { data: services, isLoading } = useGetServicesQuery({ includeInactive: true });
  const [createService, { isLoading: creating }] = useCreateServiceMutation();
  const [updateService, { isLoading: updating }] = useUpdateServiceMutation();
  const [deleteService] = useDeleteServiceMutation();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<ServiceFormData>(DEFAULT_SERVICE_FORM);
  const [errors, setErrors] = useState<Partial<Record<keyof ServiceFormData, string>>>({});

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

  return (
    <div className="flex flex-col gap-6" dir="rtl">
      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-semibold tracking-tight">إدارة الخدمات</h2>
          <p className="text-sm text-muted-foreground">
            إنشاء وتعديل وتعطيل خدمات الكتالوج المعروضة للعملاء.
          </p>
        </div>
        <Button size="sm" onClick={openCreate} className="mt-2 sm:mt-0 gap-1.5 h-9">
          <Plus className="h-4 w-4" />
          إضافة خدمة
        </Button>
      </div>

      <div className="rounded-xl border bg-white shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="p-6 space-y-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-12 w-full rounded-lg" />
            ))}
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/40 hover:bg-muted/40">
                <TableHead className="text-right font-semibold">الاسم (عربي)</TableHead>
                <TableHead className="text-right font-semibold">الاسم (EN)</TableHead>
                <TableHead className="text-right font-semibold">الحالة</TableHead>
                <TableHead className="text-right font-semibold w-20"> </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {!services || services.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center text-muted-foreground py-12">
                    <Wrench className="h-8 w-8 mx-auto mb-2 opacity-40" />
                    لا توجد خدمات حاليًا.
                  </TableCell>
                </TableRow>
              ) : (
                services.map((svc) => (
                  <TableRow key={svc.id} className="hover:bg-muted/20">
                    <TableCell className="font-semibold text-sm">{svc.nameAr}</TableCell>
                    <TableCell className="text-sm">{svc.name}</TableCell>
                    <TableCell>
                      {svc.isActive ? (
                        <Badge variant="default" className="bg-emerald-500 hover:bg-emerald-600">
                          نشط
                        </Badge>
                      ) : (
                        <Badge variant="secondary">معطل</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-0.5">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-muted-foreground hover:text-foreground"
                          onClick={() => openEdit(svc)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-muted-foreground hover:text-destructive"
                          onClick={() => handleDelete(svc.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        )}
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-xl p-0 overflow-hidden" dir="rtl">
          <DialogHeader className="px-6 pt-6 pb-0">
            <DialogTitle className="text-lg">
              {editingId ? "تعديل الخدمة" : "إضافة خدمة جديدة"}
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground leading-5">
              {editingId
                ? "عدّل بيانات الخدمة الحالية."
                : "أضف خدمة جديدة إلى كتالوج الخدمات."}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="p-6 pt-4 flex flex-col gap-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <Label className="text-sm font-medium">
                  اسم الخدمة (عربي) <span className="text-destructive">*</span>
                </Label>
                <Input
                  placeholder="الهوية البصرية"
                  value={form.nameAr}
                  onChange={(e) => setForm((f) => ({ ...f, nameAr: e.target.value }))}
                  onBlur={() => setErrors((e) => ({ ...e, nameAr: undefined }))}
                  className={cn("h-10", errors.nameAr && "border-destructive focus-visible:ring-destructive")}
                  required
                />
                {errors.nameAr && (
                  <span className="text-xs text-destructive flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    {errors.nameAr}
                  </span>
                )}
              </div>

              <div className="flex flex-col gap-1.5">
                <Label className="text-sm font-medium">
                  اسم الخدمة (إنجليزي) <span className="text-destructive">*</span>
                </Label>
                <Input
                  placeholder="Brand Identity"
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  onBlur={() => setErrors((e) => ({ ...e, name: undefined }))}
                  className={cn("h-10", errors.name && "border-destructive focus-visible:ring-destructive")}
                  required
                />
                {errors.name && (
                  <span className="text-xs text-destructive flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    {errors.name}
                  </span>
                )}
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <Label className="text-sm font-medium">وصف الخدمة (عربي)</Label>
              <Input
                placeholder="وصف مختصر للخدمة بالعربية"
                value={form.descriptionAr}
                onChange={(e) => setForm((f) => ({ ...f, descriptionAr: e.target.value }))}
                className="h-10"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <Label className="text-sm font-medium">وصف الخدمة (إنجليزي)</Label>
              <Input
                placeholder="Brief description in English"
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                className="h-10"
              />
            </div>

            <label className="flex items-center gap-2.5 cursor-pointer select-none group">
              <div
                className={cn(
                  "w-11 h-6 rounded-full relative transition-colors",
                  form.isActive ? "bg-emerald-500" : "bg-gray-200"
                )}
                onClick={() => setForm((f) => ({ ...f, isActive: !f.isActive }))}
              >
                <div
                  className={cn(
                    "absolute top-0.5 left-0.5 h-5 w-5 bg-white rounded-full shadow-sm transition-transform duration-200",
                    form.isActive ? "translate-x-5" : ""
                  )}
                />
              </div>
              <span className="text-sm font-medium">نشطة</span>
            </label>

            <div className="flex gap-2 justify-end mt-1 border-t pt-4">
              <Button
                type="button"
                variant="ghost"
                onClick={() => {
                  setDialogOpen(false);
                  resetForm();
                }}
              >
                إلغاء
              </Button>
              <Button type="submit" disabled={creating || updating} className="min-w-[120px]">
                {creating || updating ? "جارٍ الحفظ..." : editingId ? "حفظ التعديلات" : "إضافة الخدمة"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}