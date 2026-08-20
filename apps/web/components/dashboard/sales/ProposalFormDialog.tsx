"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useFieldArray, useForm, type FieldPath } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Check, Copy, FileText, Loader2, Plus, Trash2 } from "lucide-react";
import { DurationUnit } from "@hassad/shared";
import {
  useCreateProposalMutation,
  useUpdateProposalMutation,
  type ProposalListItem,
  type ServiceItem,
} from "@/features/proposals/proposalsApi";
import { useGetRequestsQuery } from "@/features/requests/requestsApi";
import {
  salesWorkflowErrorMessage,
  salesWorkflowValidationMessages,
} from "@/lib/i18n";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { ActionButton } from "@/components/design-system/ActionButton";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
  totalPrice: z.coerce.number().positive("أدخل الإجمالي"),
  durationDays: z.coerce.number().int().positive("أدخل مدة صحيحة"),
  durationUnit: z.nativeEnum(DurationUnit),
  platforms: z.string().trim().min(1, "اكتب المنصات أو القنوات"),
  contactName: z.string().optional(),
  contactEmail: z.string().email("أدخل بريداً صحيحاً").or(z.literal("")),
  startDate: z.string().optional(),
  offerValidityDays: z.coerce.number().int().positive("أدخل مدة صلاحية صحيحة"),
});

type ProposalFormInput = z.input<typeof proposalFormSchema>;
type ProposalFormValues = z.output<typeof proposalFormSchema>;

export interface ProposalFormDialogProps {
  mode?: "create" | "edit";
  proposal?: ProposalListItem | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
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
    platforms: proposal?.platforms?.join(", ") ?? "",
    contactName: proposal?.contactName ?? "",
    contactEmail: proposal?.contactEmail ?? "",
    startDate: proposal?.startDate
      ? String(proposal.startDate).split("T")[0]
      : "",
    offerValidityDays: proposal?.offerValidityDays ?? 30,
  };
}

export function ProposalFormDialog({
  mode = "create",
  proposal,
  open: controlledOpen,
  onOpenChange,
  preSelectedRequestId = "",
}: ProposalFormDialogProps) {
  const isEdit = mode === "edit";
  const [file, setFile] = useState<File | null>(null);
  const [shareLink, setShareLink] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const open = controlledOpen;

  const form = useForm<ProposalFormInput, unknown, ProposalFormValues>({
    resolver: zodResolver(proposalFormSchema),
    defaultValues: getDefaultValues(proposal, preSelectedRequestId),
  });
  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "servicesList",
  });
  const { data: requests = [], isFetching: requestsLoading } =
    useGetRequestsQuery({ limit: 100 }, { skip: !open });
  const [createProposal, { isLoading: isCreating }] =
    useCreateProposalMutation();
  const [updateProposal, { isLoading: isUpdating }] =
    useUpdateProposalMutation();
  const isSubmitting = isCreating || isUpdating;

  const requestOptions = useMemo(
    () =>
      requests.filter(
        (request) => isEdit || request.status === "PROPOSAL_IN_PROGRESS",
      ),
    [isEdit, requests],
  );

  useEffect(() => {
    if (!open) return;
    form.reset(getDefaultValues(proposal, preSelectedRequestId));
    if (fileInputRef.current) fileInputRef.current.value = "";
  }, [form, open, preSelectedRequestId, proposal]);

  async function onSubmit(values: ProposalFormValues) {
    if (file) {
      const isPdf =
        file.type === "application/pdf" && /\.pdf$/i.test(file.name);
      const maxFileSize = 10 * 1024 * 1024;
      if (!isPdf || file.size > maxFileSize) {
        form.setError("root", {
          message: "يجب اختيار ملف PDF بحجم لا يتجاوز 10 ميجابايت",
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
    const platforms = values.platforms
      .split(",")
      .map((platform) => platform.trim())
      .filter(Boolean);

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
            platforms,
            contactName: values.contactName,
            contactEmail: values.contactEmail,
            startDate: values.startDate || undefined,
            offerValidityDays: Number(values.offerValidityDays),
          },
        }).unwrap();
        toast.success("تم تحديث العرض الفني");
      } else if (file) {
        const result = await createProposal({
          requestId: values.requestId,
          title: values.title,
          serviceDescription: values.serviceDescription,
          platforms,
          file,
          servicesList,
          totalPrice: Number(values.totalPrice),
          durationDays: Number(values.durationDays),
          durationUnit: values.durationUnit,
          contactName: values.contactName ?? "",
          contactEmail: values.contactEmail ?? "",
          startDate: values.startDate ?? "",
          offerValidityDays: Number(values.offerValidityDays),
        }).unwrap();
        toast.success("تم إنشاء العرض الفني");
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
        <DialogHeader className="shrink-0 border-b px-6 py-4 text-right">
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
              <FormField
                control={form.control}
                name="requestId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>الطلب المرتبط</FormLabel>
                    <Select
                      value={field.value}
                      onValueChange={field.onChange}
                      disabled={
                        isEdit ||
                        requestsLoading ||
                        Boolean(preSelectedRequestId)
                      }
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="اختر الطلب" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectGroup>
                          {requestOptions.map((request) => (
                            <SelectItem key={request.id} value={request.id}>
                              {request.companyName} — {request.contactName}
                            </SelectItem>
                          ))}
                        </SelectGroup>
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      تظهر هنا الطلبات الجاهزة لإعداد العرض.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

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
                <FormField
                  control={form.control}
                  name="startDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>تاريخ البداية</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
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
                    <FormLabel>وصف الخدمات</FormLabel>
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

              <Card>
                <CardHeader className="gap-1">
                  <CardTitle className="text-base">الخدمات والتسعير</CardTitle>
                  <CardDescription>
                    أضف الخدمات التي يتضمنها العرض وقيمتها.
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex flex-col gap-4">
                  {fields.map((field, index) => (
                    <div
                      key={field.id}
                      className="grid gap-3 rounded-lg border p-3 md:grid-cols-[minmax(0,1fr)_160px_auto]"
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
                              <Input
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
                        <ActionButton
                          type="button"
                          variant="ghost"
                          size="icon"
                          aria-label="حذف الخدمة"
                          disabled={fields.length === 1}
                          onClick={() => remove(index)}
                        >
                          <Trash2 data-icon="inline-start" />
                        </ActionButton>
                      </div>
                      <FormField
                        control={form.control}
                        name={`servicesList.${index}.description`}
                        render={({ field: input }) => (
                          <FormItem className="md:col-span-3">
                            <FormLabel>ملاحظات الخدمة</FormLabel>
                            <FormControl>
                              <Input placeholder="اختياري" {...input} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  ))}
                  <ActionButton
                    type="button"
                    variant="outline"
                    onClick={() =>
                      append({ name: "", price: 0, description: "" })
                    }
                  >
                    <Plus data-icon="inline-start" />
                    إضافة خدمة
                  </ActionButton>
                </CardContent>
              </Card>

              <div className="grid gap-4 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name="totalPrice"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>الإجمالي</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min="0"
                          step="0.01"
                          value={String(field.value ?? "")}
                          onChange={(event) =>
                            field.onChange(event.target.value)
                          }
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="platforms"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>المنصات أو القنوات</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="مثال: Instagram, Website"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="durationDays"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>المدة</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min="1"
                          value={String(field.value ?? "")}
                          onChange={(event) =>
                            field.onChange(event.target.value)
                          }
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="durationUnit"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>وحدة المدة</FormLabel>
                      <Select
                        value={field.value}
                        onValueChange={field.onChange}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="اختر الوحدة" />
                          </SelectTrigger>
                        </FormControl>
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
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="offerValidityDays"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>صلاحية العرض بالأيام</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min="1"
                          value={String(field.value ?? "")}
                          onChange={(event) =>
                            field.onChange(event.target.value)
                          }
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name="contactName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>اسم جهة الاتصال</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="contactEmail"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>البريد الإلكتروني</FormLabel>
                      <FormControl>
                        <Input type="email" dir="ltr" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="flex flex-col gap-2">
                {isEdit ? (
                  <p className="text-sm text-muted-foreground">
                    ملف العرض الحالي محفوظ. استبدال الملفات سيكون متاحاً بعد دعم
                    ذلك في واجهة التحديث.
                  </p>
                ) : (
                  <>
                    <Label htmlFor="proposal-file">ملف العرض PDF</Label>
                    <Input
                      ref={fileInputRef}
                      id="proposal-file"
                      type="file"
                      accept="application/pdf,.pdf"
                      required
                      aria-invalid={Boolean(form.formState.errors.root)}
                      aria-describedby="proposal-file-message"
                      onChange={(event) => {
                        form.clearErrors("root");
                        setFile(event.target.files?.[0] ?? null);
                      }}
                    />
                    <p className="text-sm text-muted-foreground">
                      {file?.name ?? "اختر ملف PDF"}
                    </p>
                  </>
                )}
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
                    <ActionButton
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={copyShareLink}
                    >
                      <Copy data-icon="inline-start" />
                      نسخ الرابط
                    </ActionButton>
                  </AlertDescription>
                </Alert>
              ) : null}
            </form>
          </Form>
        </div>

        <DialogFooter className="shrink-0 border-t bg-background px-6 py-4">
          <ActionButton
            type="button"
            variant="outline"
            onClick={() => handleOpenChange(false)}
          >
            إلغاء
          </ActionButton>
          <ActionButton
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
          </ActionButton>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
