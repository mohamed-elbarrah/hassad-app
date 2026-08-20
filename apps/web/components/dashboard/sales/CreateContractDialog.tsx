"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useForm, useWatch, type FieldPath } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { FileSignature, Loader2 } from "lucide-react";
import {
  ContractType,
  PaymentAmountType,
  ProposalStatus,
} from "@hassad/shared";
import {
  useCreateContractMutation,
  useUpdateContractMutation,
  type ContractItem,
} from "@/features/contracts/contractsApi";
import { useGetProposalsQuery } from "@/features/proposals/proposalsApi";
import {
  salesWorkflowErrorMessage,
  salesWorkflowValidationMessages,
} from "@/lib/i18n";
import { Button } from "@/components/ui/button";
import { CalculatedAmount } from "@/components/ui/calculated-amount";
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

const contractFormSchema = z
  .object({
    requestId: z.string().min(1, "الطلب المرتبط مطلوب"),
    proposalId: z.string().optional(),
    title: z.string().trim().min(2, "اكتب عنوان العقد"),
    type: z.nativeEnum(ContractType),
    monthlyValue: z.coerce.number().nonnegative().optional(),
    totalValue: z.coerce.number().nonnegative().optional(),
    numberOfMonths: z.coerce.number().int().positive().optional(),
    initialPaymentRequired: z.boolean().default(true),
    initialPaymentType: z.enum(["PERCENT", "FIXED"]).default("PERCENT"),
    initialPaymentValue: z.coerce.number().positive().optional(),
    startDate: z.string().min(1, "تاريخ البداية مطلوب"),
    endDate: z.string().min(1, "تاريخ النهاية مطلوب"),
  })
  .superRefine((values, context) => {
    if (
      values.startDate &&
      values.endDate &&
      values.endDate < values.startDate
    ) {
      context.addIssue({
        code: "custom",
        path: ["endDate"],
        message: "يجب أن يكون تاريخ النهاية بعد تاريخ البداية",
      });
    }
  });

type ContractFormInput = z.input<typeof contractFormSchema>;
type ContractFormValues = z.output<typeof contractFormSchema>;

export interface CreateContractDialogProps {
  proposalId?: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSaved?: () => void;
  mode?: "create" | "edit";
  contract?: ContractItem | null;
  preSelectedRequestId?: string;
}

const contractTypeLabels: Partial<Record<ContractType, string>> = {
  [ContractType.MONTHLY_RETAINER]: "اشتراك شهري",
  [ContractType.FIXED_PROJECT]: "مشروع ثابت",
};

function getDefaultValues(
  contract: ContractItem | null | undefined,
  requestId: string,
  proposalId: string,
): ContractFormInput {
  return {
    requestId: contract?.requestId ?? requestId,
    proposalId: contract?.proposalId ?? proposalId,
    title: contract?.title ?? "",
    type: contract?.type ?? ContractType.FIXED_PROJECT,
    monthlyValue: contract?.monthlyValue ?? 0,
    totalValue: contract?.totalValue ?? 0,
    numberOfMonths: contract?.numberOfMonths ?? 1,
    initialPaymentRequired: contract?.initialPaymentRequired ?? true,
    initialPaymentType:
      (contract?.downPaymentType as "PERCENT" | "FIXED") ?? "PERCENT",
    initialPaymentValue: contract?.downPaymentValue ?? 30,
    startDate: contract?.startDate
      ? String(contract.startDate).split("T")[0]
      : "",
    endDate: contract?.endDate ? String(contract.endDate).split("T")[0] : "",
  };
}

export function CreateContractDialog({
  proposalId = "",
  open: controlledOpen,
  onOpenChange,
  onSaved,
  mode = "create",
  contract,
  preSelectedRequestId = "",
}: CreateContractDialogProps) {
  const isEdit = mode === "edit";
  const [file, setFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const open = controlledOpen;

  const form = useForm<ContractFormInput, unknown, ContractFormValues>({
    resolver: zodResolver(contractFormSchema),
    defaultValues: getDefaultValues(contract, preSelectedRequestId, proposalId),
  });
  const selectedProposalId = useWatch({
    control: form.control,
    name: "proposalId",
  });
  const selectedType = useWatch({ control: form.control, name: "type" });
  const numberOfMonths = useWatch({
    control: form.control,
    name: "numberOfMonths",
  });
  const initialPaymentRequired = useWatch({
    control: form.control,
    name: "initialPaymentRequired",
  });
  const initialPaymentType = useWatch({
    control: form.control,
    name: "initialPaymentType",
  });
  const initialPaymentValue = useWatch({
    control: form.control,
    name: "initialPaymentValue",
  });
  const { data: proposalsData, isFetching: proposalsLoading } =
    useGetProposalsQuery(
      { status: ProposalStatus.APPROVED, limit: 100 },
      { skip: !open || isEdit },
    );
  const [createContract, { isLoading: isCreating }] =
    useCreateContractMutation();
  const [updateContract, { isLoading: isUpdating }] =
    useUpdateContractMutation();
  const isSubmitting = isCreating || isUpdating;

  const proposalOptions = useMemo(() => {
    const proposals = proposalsData?.items ?? [];
    return preSelectedRequestId
      ? proposals.filter(
          (proposal) => proposal.requestId === preSelectedRequestId,
        )
      : proposals;
  }, [preSelectedRequestId, proposalsData?.items]);
  const selectedProposal = proposalOptions.find(
    (proposal) => proposal.id === selectedProposalId,
  );

  useEffect(() => {
    if (!open) return;
    form.reset(getDefaultValues(contract, preSelectedRequestId, proposalId));
    if (fileInputRef.current) fileInputRef.current.value = "";
  }, [contract, form, open, preSelectedRequestId, proposalId]);

  useEffect(() => {
    if (isEdit || !selectedProposalId) return;
    const selectedProposal = proposalOptions.find(
      (proposal) => proposal.id === selectedProposalId,
    );
    if (!selectedProposal) return;

    form.setValue("requestId", selectedProposal.requestId ?? "", {
      shouldValidate: true,
    });
    form.setValue("title", selectedProposal.title ?? "", {
      shouldValidate: true,
    });
    form.setValue("totalValue", selectedProposal.totalPrice ?? 0);
  }, [form, isEdit, proposalOptions, selectedProposalId]);

  useEffect(() => {
    if (selectedType !== ContractType.MONTHLY_RETAINER) {
      form.setValue("monthlyValue", 0);
      return;
    }

    const total = Number(form.getValues("totalValue") ?? 0);
    const months = Number(numberOfMonths ?? 0);
    const paymentValue = Number(initialPaymentValue ?? 0);
    const initialAmount =
      initialPaymentRequired && initialPaymentType === "PERCENT"
        ? total * (paymentValue / 100)
        : initialPaymentRequired
          ? paymentValue
          : 0;
    const remainingMonths = months - 1;
    form.setValue(
      "monthlyValue",
      months > 0 && remainingMonths > 0
        ? (total - initialAmount) / remainingMonths
        : 0,
      {
        shouldValidate: true,
      },
    );
  }, [
    form,
    initialPaymentRequired,
    initialPaymentType,
    initialPaymentValue,
    numberOfMonths,
    selectedProposalId,
    selectedType,
  ]);

  async function onSubmit(values: ContractFormValues) {
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
    if (!isEdit && !values.proposalId) {
      form.setError("root", { message: "اختر عرضاً معتمداً للعقد" });
      return;
    }
    if (!isEdit && !file) {
      form.setError("root", { message: "اختر ملف PDF للعقد" });
      return;
    }

    try {
      if (isEdit && contract) {
        await updateContract({
          id: contract.id,
          body: {
            title: values.title,
            monthlyValue: values.monthlyValue,
            totalValue: values.totalValue,
            startDate: values.startDate,
            endDate: values.endDate,
          },
        }).unwrap();
        toast.success("تم تحديث العقد");
        onSaved?.();
      } else if (file) {
        await createContract({
          requestId: values.requestId,
          title: values.title,
          type: values.type,
          monthlyValue: values.monthlyValue,
          totalValue: values.totalValue,
          numberOfMonths: values.numberOfMonths,
          initialPaymentRequired: values.initialPaymentRequired,
          initialPaymentType: values.initialPaymentType as PaymentAmountType,
          initialPaymentValue: values.initialPaymentValue,
          startDate: values.startDate,
          endDate: values.endDate,
          proposalId: values.proposalId || undefined,
          file,
        }).unwrap();
        toast.success("تم إنشاء العقد");
        onSaved?.();
      }

      handleOpenChange(false);
    } catch (error) {
      const validationMessages = salesWorkflowValidationMessages(error);
      for (const [field, message] of Object.entries(validationMessages)) {
        form.setError(field as FieldPath<ContractFormInput>, { message });
      }
      toast.error(salesWorkflowErrorMessage(error));
    }
  }

  function handleOpenChange(nextOpen: boolean) {
    if (!nextOpen) {
      setFile(null);
      form.clearErrors();
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
    onOpenChange(nextOpen);
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent
        className="flex max-h-[90vh] max-w-2xl flex-col gap-0 overflow-hidden p-0"
        dir="rtl"
      >
        <DialogHeader className="shrink-0 border-b px-6 py-4 text-right">
          <DialogTitle>{isEdit ? "تعديل العقد" : "إنشاء عقد"}</DialogTitle>
          <DialogDescription>
            اربط العقد بالعرض المعتمد وأكمل بيانات العقد والملف المرفق.
          </DialogDescription>
        </DialogHeader>

        <div className="min-h-0 flex-1 overflow-y-auto px-6 py-5">
          <Form {...form}>
            <form
              id="contract-form"
              onSubmit={form.handleSubmit(onSubmit)}
              className="flex flex-col gap-5"
            >
              <div className="flex flex-col gap-3 rounded-lg border border-border/60 p-4">
                <div className="flex flex-col gap-1">
                  <h2 className="text-base font-semibold">
                    ملخص العرض المعتمد
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    يتم إنشاء العقد من نسخة العرض المعتمد ولا يمكن تعديل قيمته
                    هنا.
                  </p>
                </div>
                {selectedProposal ? (
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div>
                      <p className="text-xs text-muted-foreground">
                        عنوان العرض
                      </p>
                      <p className="font-medium">{selectedProposal.title}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">العميل</p>
                      <p className="font-medium">
                        {selectedProposal.client?.companyName ??
                          selectedProposal.request?.companyName ??
                          "—"}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">
                        القيمة المعتمدة
                      </p>
                      <p className="font-medium">
                        {selectedProposal.totalPrice ?? 0} SAR
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">الخدمات</p>
                      <p className="font-medium">
                        {selectedProposal.servicesList?.length ?? 0} خدمة
                      </p>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    {proposalsLoading
                      ? "جارٍ تحميل العرض..."
                      : "لم يتم العثور على العرض المعتمد."}
                  </p>
                )}
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>عنوان العقد</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="مثال: عقد إدارة الحملات"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>نوع العقد</FormLabel>
                      <Select
                        value={field.value}
                        onValueChange={field.onChange}
                        disabled={isEdit}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="اختر النوع" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectGroup>
                            {Object.entries(contractTypeLabels).map(
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
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                {selectedType === ContractType.MONTHLY_RETAINER ? (
                  <>
                    <FormField
                      control={form.control}
                      name="numberOfMonths"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>عدد أشهر الاشتراك</FormLabel>
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
                      name="monthlyValue"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>القيمة الشهرية المحسوبة</FormLabel>
                          <FormControl>
                            <CalculatedAmount
                              ariaLabel="القيمة الشهرية المحسوبة"
                              value={Number(field.value ?? 0)}
                            />
                          </FormControl>
                          <FormDescription>
                            تُحسب من القيمة المعتمدة وعدد أشهر الاشتراك.
                          </FormDescription>
                        </FormItem>
                      )}
                    />
                  </>
                ) : null}
                <div className="flex flex-col gap-3 rounded-lg border border-border/60 p-4 md:col-span-2">
                  <div>
                    <h2 className="text-base font-semibold">الدفعة الأولية</h2>
                    <p className="text-sm text-muted-foreground">
                      يجب سداد الدفعة الأولية قبل تمكين العميل من توقيع العقد.
                    </p>
                  </div>
                  <FormField
                    control={form.control}
                    name="initialPaymentRequired"
                    render={({ field }) => (
                      <FormItem className="flex items-center justify-between rounded-md border p-3">
                        <FormLabel>يتطلب دفعة أولية</FormLabel>
                        <FormControl>
                          <input
                            type="checkbox"
                            checked={field.value}
                            onChange={field.onChange}
                            className="size-4 accent-primary"
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  {initialPaymentRequired ? (
                    <div className="grid gap-3 sm:grid-cols-2">
                      <FormField
                        control={form.control}
                        name="initialPaymentType"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>نوع الدفعة</FormLabel>
                            <Select
                              value={field.value}
                              onValueChange={field.onChange}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="PERCENT">
                                  نسبة من الإجمالي
                                </SelectItem>
                                <SelectItem value="FIXED">مبلغ ثابت</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="initialPaymentValue"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>
                              {initialPaymentType === "PERCENT"
                                ? "النسبة"
                                : "المبلغ"}
                            </FormLabel>
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
                    </div>
                  ) : null}
                </div>
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
                <FormField
                  control={form.control}
                  name="endDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>تاريخ النهاية</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="flex flex-col gap-2">
                {isEdit ? (
                  <p className="text-sm text-muted-foreground">
                    ملف العقد الحالي محفوظ. استبدال الملفات سيكون متاحاً بعد دعم
                    ذلك في واجهة التحديث.
                  </p>
                ) : (
                  <>
                    <Label htmlFor="contract-file">ملف العقد PDF</Label>
                    <Input
                      ref={fileInputRef}
                      id="contract-file"
                      type="file"
                      accept="application/pdf,.pdf"
                      required
                      aria-invalid={Boolean(form.formState.errors.root)}
                      aria-describedby="contract-file-message"
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
                    id="contract-file-message"
                    className="text-sm font-medium text-destructive"
                    role="alert"
                  >
                    {form.formState.errors.root.message}
                  </p>
                ) : null}
              </div>
            </form>
          </Form>
        </div>

        <DialogFooter className="shrink-0 border-t bg-background px-6 py-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => handleOpenChange(false)}
          >
            إلغاء
          </Button>
          <Button type="submit" form="contract-form" disabled={isSubmitting}>
            {isSubmitting ? (
              <Loader2 data-icon="inline-start" className="animate-spin" />
            ) : (
              <FileSignature data-icon="inline-start" />
            )}
            {isEdit ? "حفظ التعديلات" : "إنشاء العقد"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
