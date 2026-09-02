"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  useFieldArray,
  useForm,
  useWatch,
  type FieldPath,
} from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Check, Copy, FileText, Loader2, Plus, Trash2 } from "lucide-react";
import { DurationUnit } from "@hassad/shared";
import {
  useCreateSalesProposalMutation,
  useUpdateSalesProposalMutation,
  type ProposalListItem,
  type ServiceItem,
  type UpdateProposalFormInput,
} from "@/features/proposals/proposalsApi";
import {
  salesWorkflowErrorMessage,
  salesWorkflowValidationMessages,
} from "@/lib/i18n";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { CalculatedAmount } from "@/components/ui/calculated-amount";
import { CurrencyInput } from "@/components/ui/currency-input";

const proposalFormSchema = z.object({
  requestId: z.string().min(1, "اختر الطلب المرتبط"),
  title: z.string().trim().min(2, "اكتب عنوان العرض"),
  serviceDescription: z.string().trim().min(2, "اكتب وصف الخدمات"),
  servicesList: z
    .array(
      z.object({
        name: z.string().trim().min(1, "اكتب اسم الخدمة"),
        price: z.coerce.number().positive("أدخل سعراً صحيحاً"),
        description: z.string().optional(),
      }),
    )
    .min(1, "أضف خدمة واحدة على الأقل"),
  totalPrice: z.coerce.number().nonnegative(),
  durationDays: z.coerce.number().int().positive("أدخل مدة صحيحة"),
  durationUnit: z.nativeEnum(DurationUnit),
});

type ProposalFormInput = z.input<typeof proposalFormSchema>;
type ProposalFormValues = z.output<typeof proposalFormSchema>;

export interface ProposalFormDialogProps {
  mode?: "create" | "edit";
  proposal?: ProposalListItem | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSaved?: () => void;
  preSelectedRequestId?: string;
}

const durationLabels: Record<DurationUnit, string> = {
  [DurationUnit.DAYS]: "أيام",
  [DurationUnit.WEEKS]: "أسابيع",
  [DurationUnit.MONTHS]: "أشهر",
};

function toServiceItems(
  services: ProposalListItem["servicesList"] | undefined,
): ServiceItem[] {
  return services?.length
    ? services.map((service) => ({
        name: service.name ?? "",
        price: Number(service.price ?? 0),
        description: service.description ?? "",
      }))
    : [{ name: "", price: 0, description: "" }];
}

function getDefaultValues(
  proposal: ProposalListItem | null | undefined,
  requestId: string,
): ProposalFormInput {
  return {
    requestId: proposal?.requestId ?? requestId,
    title: proposal?.title ?? "",
    serviceDescription: proposal?.serviceDescription ?? "",
    servicesList: toServiceItems(proposal?.servicesList),
    totalPrice: proposal?.totalPrice ?? 0,
    durationDays: proposal?.durationDays ?? 30,
    durationUnit: (proposal?.durationUnit as DurationUnit) ?? DurationUnit.DAYS,
  };
}

export function ProposalFormDialog({
  mode = "create",
  proposal,
  open: controlledOpen,
  onOpenChange,
  onSaved,
  preSelectedRequestId = "",
}: ProposalFormDialogProps) {
  const isEdit = mode === "edit";
  const [file, setFile] = useState<File | null>(null);
  const [shareLink, setShareLink] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const initializedDialogRef = useRef<string | null>(null);
  const open = controlledOpen;

  const form = useForm<ProposalFormInput, unknown, ProposalFormValues>({
    resolver: zodResolver(proposalFormSchema),
    defaultValues: getDefaultValues(proposal, preSelectedRequestId),
  });
  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "servicesList",
  });
  const watchedServices = useWatch({
    control: form.control,
    name: "servicesList",
  });
  const calculatedTotal = useMemo(
    () =>
      (watchedServices ?? []).reduce((total, service) => {
        const price = Number(service?.price ?? 0);
        return total + (Number.isFinite(price) ? price : 0);
      }, 0),
    [watchedServices],
  );
  const [createProposal, { isLoading: isCreating }] =
    useCreateSalesProposalMutation();
  const [updateProposal, { isLoading: isUpdating }] =
    useUpdateSalesProposalMutation();
  const isSubmitting = isCreating || isUpdating;

  // A pipeline refresh can replace `proposal` while this dialog is open. The
  // dialog identity, rather than object identity, controls initialization so
  // server refreshes never overwrite edits already made by the user.
  useEffect(() => {
    if (!open) {
      initializedDialogRef.current = null;
      return;
    }

    const dialogKey = `${mode}:${proposal?.id ?? "new"}:${preSelectedRequestId}`;
    if (initializedDialogRef.current === dialogKey) return;
    if (form.formState.isDirty || file) return;

    form.reset(getDefaultValues(proposal, preSelectedRequestId));
    initializedDialogRef.current = dialogKey;
    if (fileInputRef.current) fileInputRef.current.value = "";
  }, [file, form, mode, open, preSelectedRequestId, proposal]);

  useEffect(() => {
    form.setValue("totalPrice", calculatedTotal, { shouldValidate: true });
  }, [calculatedTotal, form]);

  async function onSubmit(values: ProposalFormValues) {
    if (file) {
      const isPdf =
        file.type === "application/pdf" && /\.pdf$/i.test(file.name);
      const maxFileSize = 50 * 1024 * 1024;
      if (!isPdf || file.size > maxFileSize) {
        form.setError("root", {
          message: "يجب اختيار ملف PDF بحجم لا يتجاوز 50 ميجابايت",
        });
        return;
      }
    }
    if (!isEdit && !file) {
      form.setError("root", { message: "اختر ملف PDF للعرض" });
      return;
    }

    const servicesList = values.servicesList.map((service) => ({
      name: service.name,
      price: Number(service.price),
      ...(service.description ? { description: service.description } : {}),
    }));
    try {
      if (isEdit && proposal) {
        await updateProposal({
          id: proposal.id,
          body: {
            title: values.title,
            serviceDescription: values.serviceDescription,
            servicesList,
            totalPrice: Number(values.totalPrice),
            durationDays: Number(values.durationDays),
            durationUnit: values.durationUnit,
            ...(file ? { file } : {}),
          } satisfies UpdateProposalFormInput,
        }).unwrap();
        toast.success("تم تحديث العرض الفني");
        onSaved?.();
      } else if (file) {
        const result = await createProposal({
          requestId: values.requestId,
          title: values.title,
          serviceDescription: values.serviceDescription,
          file,
          servicesList,
          totalPrice: Number(values.totalPrice),
          durationDays: Number(values.durationDays),
          durationUnit: values.durationUnit,
        }).unwrap();
        toast.success("تم إنشاء العرض الفني");
        onSaved?.();
        if (result.shareLinkToken) {
          setShareLink(
            `${window.location.origin}/proposal/${result.shareLinkToken}`,
          );
          return;
        }
      }

      handleOpenChange(false);
    } catch (error) {
      const validationMessages = salesWorkflowValidationMessages(error);
      for (const [field, message] of Object.entries(validationMessages)) {
        form.setError(field as FieldPath<ProposalFormInput>, { message });
      }
      toast.error(salesWorkflowErrorMessage(error));
    }
  }

  async function copyShareLink() {
    if (!shareLink) return;
    await navigator.clipboard.writeText(shareLink);
    toast.success("تم نسخ الرابط");
  }

  function handleOpenChange(nextOpen: boolean) {
    if (!nextOpen) {
      setFile(null);
      setShareLink(null);
      form.reset(getDefaultValues(null, ""));
      form.clearErrors();
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
    onOpenChange(nextOpen);
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent
        className="flex max-h-[90vh] max-w-3xl flex-col gap-0 overflow-hidden p-0"
        dir="rtl"
      >
        <DialogHeader className="shrink-0  border-b px-6 py-4 text-right">
          <DialogTitle>
            {isEdit ? "تعديل العرض الفني" : "إنشاء عرض فني"}
          </DialogTitle>
          <DialogDescription>
            أدخل بيانات العرض والخدمات ثم ارفع ملف العرض بصيغة PDF.
          </DialogDescription>
        </DialogHeader>

        <div className="min-h-0 flex-1 overflow-y-auto px-6 py-5">
          <Form {...form}>
            <form
              id="proposal-form"
              onSubmit={form.handleSubmit(onSubmit)}
              className="flex flex-col gap-5"
            >
              <input type="hidden" {...form.register("requestId")} />
              <div className=" rounded-xl border border-primary/20 bg-primary/5 px-4 py-3 text-right">
                <p className="text-sm font-medium text-foreground">
                  الطلب المرتبط
                </p>
                <p className="mt-1 text-sm text-muted-foreground">
                  تم ربط هذا العرض بالطلب المحدد من مسار المبيعات.
                </p>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>عنوان العرض</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="مثال: عرض تطوير الهوية البصرية"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="serviceDescription"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>وصف العرض</FormLabel>
                    <FormControl>
                      <Textarea
                        rows={3}
                        placeholder="صف نطاق العمل والمخرجات الأساسية"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex flex-col gap-4">
                <div className="flex flex-col gap-1">
                  <h2 className="text-base font-semibold">الخدمات والتسعير</h2>
                  <p className="text-sm text-muted-foreground">
                    أضف الخدمات التي يتضمنها العرض وقيمتها.
                  </p>
                </div>
                {fields.map((field, index) => (
                  <div
                    key={field.id}
                    className="grid gap-3  rounded-xl  p-3 md:grid-cols-[minmax(0,1fr)_160px_auto]"
                  >
                    <FormField
                      control={form.control}
                      name={`servicesList.${index}.name`}
                      render={({ field: input }) => (
                        <FormItem>
                          <FormLabel>الخدمة</FormLabel>
                          <FormControl>
                            <Input placeholder="اسم الخدمة" {...input} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name={`servicesList.${index}.price`}
                      render={({ field: input }) => (
                        <FormItem>
                          <FormLabel>السعر</FormLabel>
                          <FormControl>
                            <CurrencyInput
                              type="number"
                              min="0"
                              step="0.01"
                              value={String(input.value ?? "")}
                              onChange={(event) =>
                                input.onChange(event.target.value)
                              }
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <div className="flex items-end">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        aria-label="حذف الخدمة"
                        disabled={fields.length === 1}
                        onClick={() => remove(index)}
                      >
                        <Trash2 data-icon="inline-start" />
                      </Button>
                    </div>
                    <FormField
                      control={form.control}
                      name={`servicesList.${index}.description`}
                      render={({ field: input }) => (
                        <FormItem className="md:col-span-3">
                          <FormLabel>ملاحظات الخدمة</FormLabel>
                          <FormControl>
                            <Textarea
                              rows={2}
                              placeholder="أضف ملاحظات أو مخرجات هذه الخدمة"
                              {...input}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                ))}
                <Button
                  type="button"
                  variant="outline"
                  className="self-start"
                  onClick={() =>
                    append({ name: "", price: 0, description: "" })
                  }
                >
                  <Plus data-icon="inline-start" />
                  إضافة خدمة
                </Button>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name="totalPrice"
                  render={({ field }) => (
                    <FormItem className="flex-1">
                      <FormLabel>الإجمالي المحسوب</FormLabel>
                      <FormControl>
                        <CalculatedAmount
                          ariaLabel="الإجمالي المحسوب"
                          value={Number(field.value ?? 0)}
                        />
                      </FormControl>
                      <FormDescription>
                        يتم حساب الإجمالي تلقائياً من أسعار الخدمات.
                      </FormDescription>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="durationDays"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>مدة التنفيذ</FormLabel>
                      <div className="flex items-start gap-2">
                        <FormControl>
                          <Input
                            className="min-w-0 flex-1"
                            type="number"
                            min="1"
                            value={String(field.value ?? "")}
                            onChange={(event) =>
                              field.onChange(event.target.value)
                            }
                            placeholder="مثال: 30"
                            aria-label="قيمة مدة التنفيذ"
                          />
                        </FormControl>
                        <FormField
                          control={form.control}
                          name="durationUnit"
                          render={({ field: unitField }) => (
                            <FormItem className="w-36 shrink-0">
                              <FormControl>
                                <Select
                                  value={unitField.value}
                                  onValueChange={unitField.onChange}
                                >
                                  <SelectTrigger aria-label="وحدة مدة التنفيذ">
                                    <SelectValue placeholder="الوحدة" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectGroup>
                                      {Object.entries(durationLabels).map(
                                        ([value, label]) => (
                                          <SelectItem key={value} value={value}>
                                            {label}
                                          </SelectItem>
                                        ),
                                      )}
                                    </SelectGroup>
                                  </SelectContent>
                                </Select>
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                      <FormDescription>
                        حدد المدة المتوقعة لتسليم المشروع ووحدتها.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="flex flex-col gap-2">
                <>
                  <Label htmlFor="proposal-file">
                    {isEdit ? "استبدال ملف العرض (اختياري)" : "ملف العرض PDF"}
                  </Label>
                  <Input
                    ref={fileInputRef}
                    id="proposal-file"
                    type="file"
                    accept="application/pdf,.pdf"
                    aria-invalid={Boolean(form.formState.errors.root)}
                    aria-describedby="proposal-file-message"
                    onChange={(event) => {
                      form.clearErrors("root");
                      setFile(event.target.files?.[0] ?? null);
                    }}
                  />
                  <p className="text-sm text-muted-foreground">
                    {file?.name ??
                      (isEdit
                        ? "اتركه فارغاً للاحتفاظ بالملف الحالي"
                        : "اختر ملف PDF")}
                  </p>
                </>
                {form.formState.errors.root?.message ? (
                  <p
                    id="proposal-file-message"
                    className="text-sm font-medium text-destructive"
                    role="alert"
                  >
                    {form.formState.errors.root.message}
                  </p>
                ) : null}
              </div>

              {shareLink ? (
                <Alert>
                  <Check data-icon="inline-start" />
                  <AlertTitle>تم إنشاء العرض</AlertTitle>
                  <AlertDescription className="flex flex-wrap items-center gap-2">
                    <span className="min-w-0 flex-1 truncate" dir="ltr">
                      {shareLink}
                    </span>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={copyShareLink}
                    >
                      <Copy data-icon="inline-start" />
                      نسخ الرابط
                    </Button>
                  </AlertDescription>
                </Alert>
              ) : null}
            </form>
          </Form>
        </div>

        <DialogFooter className="shrink-0 flex-row-reverse justify-start gap-3 border-t bg-background px-6 py-4">
          <Button
            type="button"
            variant="destructive"
            onClick={() => handleOpenChange(false)}
          >
            إلغاء
          </Button>
          <Button
            type="submit"
            form="proposal-form"
            disabled={isSubmitting || Boolean(shareLink)}
          >
            {isSubmitting ? (
              <Loader2 data-icon="inline-start" className="animate-spin" />
            ) : (
              <FileText data-icon="inline-start" />
            )}
            {shareLink
              ? "تم إنشاء العرض"
              : isEdit
                ? "حفظ التعديلات"
                : "إنشاء العرض"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
