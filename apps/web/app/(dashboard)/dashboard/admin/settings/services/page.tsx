"use client";

import { useMemo, useState, type FormEvent } from "react";
import {
  Archive,
  BriefcaseBusiness,
  Pencil,
  Plus,
  RefreshCw,
  RotateCcw,
} from "lucide-react";
import { ServiceCategory, SERVICE_CATEGORY_AR } from "@hassad/shared";
import { toast } from "sonner";
import { PageHeader } from "@/components/common/PageHeader";
import {
  AdminEmptyState,
  AdminPageError,
  AdminPageLoading,
} from "@/components/dashboard/admin/shared";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import {
  useArchiveAdminServiceMutation,
  useCreateAdminServiceMutation,
  useGetAdminServicesQuery,
  useUpdateAdminServiceMutation,
  type ServiceCatalogItem,
} from "@/features/admin/adminServicesApi";
import type {
  CreateServicePayload,
  UpdateServicePayload,
} from "@/features/services/servicesApi";
import { adminErrorMessage, adminSuccessMessage } from "@/lib/i18n";
import { formatCurrency, formatNumber } from "@/lib/format";

const categoryOptions = Object.values(ServiceCategory);

type ServiceFormState = {
  name: string;
  nameAr: string;
  description: string;
  descriptionAr: string;
  category: ServiceCategory;
  estimatedDays: string;
  basePrice: string;
  sortOrder: string;
};

const emptyForm: ServiceFormState = {
  name: "",
  nameAr: "",
  description: "",
  descriptionAr: "",
  category: ServiceCategory.OTHER,
  estimatedDays: "30",
  basePrice: "0",
  sortOrder: "0",
};

function formFromService(service?: ServiceCatalogItem): ServiceFormState {
  if (!service) return emptyForm;
  return {
    name: service.name,
    nameAr: service.nameAr,
    description: service.description ?? "",
    descriptionAr: service.descriptionAr ?? "",
    category: service.category as ServiceCategory,
    estimatedDays: String(service.estimatedDays),
    basePrice: String(service.basePrice),
    sortOrder: String(service.sortOrder),
  };
}

function ServiceForm({
  initial,
  isSaving,
  onCancel,
  onSubmit,
}: {
  initial: ServiceFormState;
  isSaving: boolean;
  onCancel: () => void;
  onSubmit: (payload: CreateServicePayload) => void;
}) {
  const [form, setForm] = useState(initial);
  const [submitted, setSubmitted] = useState(false);
  const update = (key: keyof ServiceFormState, value: string) =>
    setForm((current) => ({ ...current, [key]: value }));
  const nameInvalid = submitted && !form.name.trim();
  const nameArInvalid = submitted && !form.nameAr.trim();
  const estimatedDays = Number(form.estimatedDays);
  const basePrice = Number(form.basePrice);
  const sortOrder = Number(form.sortOrder);
  const numericInvalid =
    submitted &&
    (!Number.isInteger(estimatedDays) ||
      estimatedDays < 1 ||
      !Number.isFinite(basePrice) ||
      basePrice < 0 ||
      !Number.isInteger(sortOrder) ||
      sortOrder < 0);

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitted(true);
    if (nameInvalid || nameArInvalid || numericInvalid) return;
    onSubmit({
      name: form.name.trim(),
      nameAr: form.nameAr.trim(),
      description: form.description.trim() || undefined,
      descriptionAr: form.descriptionAr.trim() || undefined,
      category: form.category,
      estimatedDays,
      basePrice,
      sortOrder,
    });
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-5" noValidate>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-2">
          <Label htmlFor="service-name">English name</Label>
          <Input
            id="service-name"
            value={form.name}
            onChange={(event) => update("name", event.target.value)}
            aria-invalid={nameInvalid}
          />
          {nameInvalid ? (
            <p className="text-sm text-destructive">
              English name is required.
            </p>
          ) : null}
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="service-name-ar">Arabic name</Label>
          <Input
            id="service-name-ar"
            dir="rtl"
            value={form.nameAr}
            onChange={(event) => update("nameAr", event.target.value)}
            aria-invalid={nameArInvalid}
          />
          {nameArInvalid ? (
            <p className="text-sm text-destructive">Arabic name is required.</p>
          ) : null}
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="service-category">Category</Label>
          <Select
            value={form.category}
            onValueChange={(value) => update("category", value)}
          >
            <SelectTrigger id="service-category">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {categoryOptions.map((category) => (
                <SelectItem key={category} value={category}>
                  {SERVICE_CATEGORY_AR[category]} ({category})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="service-price">Base price</Label>
          <Input
            id="service-price"
            type="number"
            min="0"
            step="0.01"
            value={form.basePrice}
            onChange={(event) => update("basePrice", event.target.value)}
          />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="service-days">Estimated days</Label>
          <Input
            id="service-days"
            type="number"
            min="1"
            step="1"
            value={form.estimatedDays}
            onChange={(event) => update("estimatedDays", event.target.value)}
            aria-invalid={numericInvalid}
          />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="service-sort-order">Sort order</Label>
          <Input
            id="service-sort-order"
            type="number"
            min="0"
            step="1"
            value={form.sortOrder}
            onChange={(event) => update("sortOrder", event.target.value)}
            aria-invalid={numericInvalid}
          />
        </div>
        <div className="flex flex-col gap-2 sm:col-span-2">
          <Label htmlFor="service-description">English description</Label>
          <Textarea
            id="service-description"
            value={form.description}
            onChange={(event) => update("description", event.target.value)}
            rows={3}
          />
        </div>
        <div className="flex flex-col gap-2 sm:col-span-2">
          <Label htmlFor="service-description-ar">Arabic description</Label>
          <Textarea
            id="service-description-ar"
            dir="rtl"
            value={form.descriptionAr}
            onChange={(event) => update("descriptionAr", event.target.value)}
            rows={3}
          />
        </div>
      </div>
      <DialogFooter>
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={isSaving}
        >
          Cancel
        </Button>
        <Button type="submit" disabled={isSaving}>
          {isSaving ? "Saving…" : "Save service"}
        </Button>
      </DialogFooter>
    </form>
  );
}

export default function AdminServicesPage() {
  const {
    data: services,
    isLoading,
    isFetching,
    isError,
    refetch,
  } = useGetAdminServicesQuery();
  const [createService, { isLoading: isCreating }] =
    useCreateAdminServiceMutation();
  const [updateService, { isLoading: isUpdating }] =
    useUpdateAdminServiceMutation();
  const [archiveService, { isLoading: isArchiving }] =
    useArchiveAdminServiceMutation();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingService, setEditingService] = useState<ServiceCatalogItem>();
  const [serviceToArchive, setServiceToArchive] =
    useState<ServiceCatalogItem>();
  const [search, setSearch] = useState("");
  const [activeFilter, setActiveFilter] = useState<
    "all" | "active" | "inactive"
  >("all");

  const visibleServices = useMemo(() => {
    const normalized = search.trim().toLowerCase();
    return (services ?? []).filter((service) => {
      const matchesSearch =
        !normalized ||
        [
          service.name,
          service.nameAr,
          service.description,
          service.descriptionAr,
          service.category,
        ]
          .filter(Boolean)
          .some((value) => String(value).toLowerCase().includes(normalized));
      const matchesStatus =
        activeFilter === "all" ||
        (activeFilter === "active" ? service.isActive : !service.isActive);
      return matchesSearch && matchesStatus;
    });
  }, [activeFilter, search, services]);

  if (isLoading)
    return (
      <div dir="rtl">
        <AdminPageLoading />
      </div>
    );
  if (isError)
    return (
      <div dir="rtl" className="flex flex-col gap-6">
        <PageHeader title="الخدمات" icon={BriefcaseBusiness} />
        <AdminPageError
          title="تعذر تحميل الخدمات"
          description="حدث خطأ أثناء جلب الخدمات. حاول مرة أخرى."
          onRetry={() => void refetch()}
        />
      </div>
    );

  const openCreate = () => {
    setEditingService(undefined);
    setDialogOpen(true);
  };
  const openEdit = (service: ServiceCatalogItem) => {
    setEditingService(service);
    setDialogOpen(true);
  };

  async function handleSubmit(payload: CreateServicePayload) {
    try {
      if (editingService) {
        const body: UpdateServicePayload = payload;
        await updateService({ id: editingService.id, body }).unwrap();
        toast.success(adminSuccessMessage("SERVICE_UPDATED"));
      } else {
        await createService(payload).unwrap();
        toast.success(adminSuccessMessage("SERVICE_CREATED"));
      }
      setDialogOpen(false);
      setEditingService(undefined);
    } catch (error) {
      toast.error(adminErrorMessage(error));
    }
  }

  async function handleArchive() {
    if (!serviceToArchive) return;
    try {
      await archiveService(serviceToArchive.id).unwrap();
      toast.success(adminSuccessMessage("SERVICE_ARCHIVED"));
      setServiceToArchive(undefined);
    } catch (error) {
      toast.error(adminErrorMessage(error));
    }
  }

  async function handleRestore(service: ServiceCatalogItem) {
    try {
      await updateService({
        id: service.id,
        body: { isActive: true },
      }).unwrap();
      toast.success(adminSuccessMessage("SERVICE_RESTORED"));
    } catch (error) {
      toast.error(adminErrorMessage(error));
    }
  }

  return (
    <div dir="rtl" className="flex flex-col gap-6">
      <PageHeader
        title="إدارة الخدمات"
        description="إدارة الخدمات المتاحة للطلبات والعروض والعقود."
        icon={BriefcaseBusiness}
        actions={
          <div className="flex flex-wrap gap-2">
            <Button onClick={openCreate}>
              <Plus data-icon="inline-start" />
              إضافة خدمة
            </Button>
            <Button
              variant="outline"
              onClick={() => refetch()}
              disabled={isFetching}
            >
              <RefreshCw data-icon="inline-start" />
              {isFetching ? "جارٍ التحديث" : "تحديث"}
            </Button>
          </div>
        }
      />
      <Card>
        <CardContent className="flex flex-col gap-4 p-4 sm:flex-row">
          <Input
            aria-label="البحث في الخدمات"
            placeholder="ابحث بالاسم أو التصنيف"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
          <Select
            value={activeFilter}
            onValueChange={(value) =>
              setActiveFilter(value as typeof activeFilter)
            }
          >
            <SelectTrigger aria-label="تصفية حالة الخدمات" className="sm:w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">كل الخدمات</SelectItem>
              <SelectItem value="active">نشطة</SelectItem>
              <SelectItem value="inactive">غير نشطة</SelectItem>
            </SelectContent>
          </Select>
        </CardContent>
      </Card>
      {!services?.length ? (
        <Card>
          <CardContent className="p-8">
            <AdminEmptyState
              icon={BriefcaseBusiness}
              title="لا توجد خدمات"
              description="أضف أول خدمة إلى كتالوج الخدمات."
              actionLabel="إضافة خدمة"
              onAction={openCreate}
            />
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="overflow-x-auto p-0">
            <Table className="min-w-[60rem]">
              <TableHeader>
                <TableRow>
                  <TableHead>الخدمة</TableHead>
                  <TableHead>التصنيف</TableHead>
                  <TableHead>السعر الأساسي</TableHead>
                  <TableHead>المدة</TableHead>
                  <TableHead>الحالة</TableHead>
                  <TableHead className="text-end">الإجراءات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {visibleServices.map((service) => (
                  <TableRow key={service.id}>
                    <TableCell>
                      <div className="flex flex-col gap-1">
                        <span className="font-medium">{service.nameAr}</span>
                        <span className="text-sm text-muted-foreground">
                          {service.name}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {SERVICE_CATEGORY_AR[
                          service.category as ServiceCategory
                        ] ?? service.category}
                      </Badge>
                    </TableCell>
                    <TableCell>{formatCurrency(service.basePrice)}</TableCell>
                    <TableCell>
                      {formatNumber(service.estimatedDays)} يوم
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={service.isActive ? "secondary" : "warning"}
                      >
                        {service.isActive ? "نشطة" : "غير نشطة"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="min-h-11 min-w-11"
                          onClick={() => openEdit(service)}
                          aria-label={`تعديل ${service.nameAr}`}
                        >
                          <Pencil data-icon="inline-start" />
                        </Button>
                        {service.isActive ? (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="min-h-11 min-w-11"
                            disabled={isArchiving}
                            onClick={() => setServiceToArchive(service)}
                            aria-label={`أرشفة ${service.nameAr}`}
                          >
                            <Archive data-icon="inline-start" />
                          </Button>
                        ) : (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="min-h-11 min-w-11"
                            disabled={isUpdating}
                            onClick={() => void handleRestore(service)}
                            aria-label={`استعادة ${service.nameAr}`}
                          >
                            <RotateCcw data-icon="inline-start" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            {!visibleServices.length ? (
              <div className="p-8">
                <AdminEmptyState
                  icon={BriefcaseBusiness}
                  title="لا توجد نتائج"
                  description="غيّر معايير البحث أو التصفية."
                />
              </div>
            ) : null}
          </CardContent>
        </Card>
      )}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-h-[90dvh] overflow-y-auto" dir="rtl">
          <DialogHeader>
            <DialogTitle>
              {editingService ? `تعديل ${editingService.nameAr}` : "إضافة خدمة"}
            </DialogTitle>
            <DialogDescription>
              أدخل بيانات الخدمة التي ستظهر لفريق المبيعات عند إنشاء الطلبات.
            </DialogDescription>
          </DialogHeader>
          <ServiceForm
            key={editingService?.id ?? "new"}
            initial={formFromService(editingService)}
            isSaving={isCreating || isUpdating}
            onCancel={() => setDialogOpen(false)}
            onSubmit={(payload) => void handleSubmit(payload)}
          />
        </DialogContent>
      </Dialog>
      <AlertDialog
        open={Boolean(serviceToArchive)}
        onOpenChange={(open) => {
          if (!open && !isArchiving) setServiceToArchive(undefined);
        }}
      >
        <AlertDialogContent dir="rtl">
          <AlertDialogHeader>
            <AlertDialogTitle>أرشفة الخدمة؟</AlertDialogTitle>
            <AlertDialogDescription>
              لن تظهر هذه الخدمة في الطلبات الجديدة، وستبقى البيانات القديمة
              محفوظة.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isArchiving}>إلغاء</AlertDialogCancel>
            <AlertDialogAction
              disabled={isArchiving}
              onClick={(event) => {
                event.preventDefault();
                void handleArchive();
              }}
            >
              {isArchiving ? "جارٍ الأرشفة" : "أرشفة"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
