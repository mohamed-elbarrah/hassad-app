"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useForm, useWatch, type FieldPath } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { FileSignature, Loader2 } from "lucide-react";
import {
  ContractStatus,
  ContractType,
  PaymentAmountType,
  ProposalStatus,
} from "@hassad/shared";
import {
  useCreateSalesContractMutation,
  useUpdateSalesContractMutation,
  type ContractItem,
} from "@/features/contracts/contractsApi";
import { useGetSalesProposalsQuery } from "@/features/proposals/proposalsApi";
import {
  salesWorkflowErrorMessage,
  salesWorkflowValidationMessages,
} from "@/lib/i18n";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/format";
import { CalculatedAmount } from "@/components/ui/calculated-amount";
import { Checkbox } from "@/components/ui/checkbox";
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
    initialPaymentValue: z.coerce.number().nonnegative().optional(),
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
    if (values.initialPaymentRequired) {
      if (values.initialPaymentValue === undefined) {
        context.addIssue({
          code: "custom",
          path: ["initialPaymentValue"],
          message: "قيمة الدفعة الأولية مطلوبة",
        });
      } else if (values.initialPaymentValue <= 0) {
        context.addIssue({
          code: "custom",
          path: ["initialPaymentValue"],
          message: "يجب أن تكون الدفعة الأولية أكبر من صفر",
        });
      } else if (
        values.initialPaymentType === "PERCENT" &&
        values.initialPaymentValue > 100
      ) {
        context.addIssue({
          code: "custom",
          path: ["initialPaymentValue"],
          message: "يجب ألا تتجاوز النسبة 100٪",
        });
      } else if (
        values.initialPaymentType === "FIXED" &&
        values.initialPaymentValue > (values.totalValue ?? 0)
      ) {
        context.addIssue({
          code: "custom",
          path: ["initialPaymentValue"],
          message: "يجب ألا تتجاوز الدفعة الأولية إجمالي العقد",
        });
      }
    }
    if (
      values.type === ContractType.MONTHLY_RETAINER &&
      values.numberOfMonths === undefined
    ) {
      context.addIssue({
        code: "custom",
        path: ["numberOfMonths"],
        message: "عدد أشهر الاشتراك مطلوب",
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

// Once signed/activated, changing billing terms would invalidate payment state.
const EDITABLE_TERM_STATUSES = new Set([
  ContractStatus.DRAFT,
  ContractStatus.SENT,
]);

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
    numberOfMonths:
      contract?.numberOfMonths ??
      (contract?.type === ContractType.MONTHLY_RETAINER ? 1 : undefined),
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
  const [fileSelection, setFileSelection] = useState<{
    file: File;
    contractId?: string;
  } | null>(null);
  const [pendingConfirmation, setPendingConfirmation] = useState<{
    values: ContractFormValues;
    intent: "save" | "send";
  } | null>(null);
  // Tie a selected file to its contract so parent updates cannot submit stale files.
  const file =
    fileSelection &&
    fileSelection.contractId === (isEdit ? contract?.id : undefined)
      ? fileSelection.file
      : null;
  const fileInputRef = useRef<HTMLInputElement>(null);
  const initializedDialogRef = useRef<string | null>(null);
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
    useGetSalesProposalsQuery(
      { status: ProposalStatus.APPROVED, limit: 100 },
      { skip: !open || isEdit },
    );
  const [createContract, { isLoading: isCreating }] =
    useCreateSalesContractMutation();
  const [updateContract, { isLoading: isUpdating }] =
    useUpdateSalesContractMutation();
  const isSubmitting = isCreating || isUpdating;
  const canEditTerms =
    !isEdit ||
    Boolean(contract?.status && EDITABLE_TERM_STATUSES.has(contract.status));
  const canEditContract = !isEdit || canEditTerms;

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
  // Edit mode does not load the proposal list; use the contract snapshot.
  const proposalSummary = selectedProposal ?? contract?.proposal;

  useEffect(() => {
    if (!open) {
      initializedDialogRef.current = null;
      return;
    }

    const dialogKey = `${mode}:${contract?.id ?? "new"}:${preSelectedRequestId}:${proposalId ?? ""}`;
    if (initializedDialogRef.current === dialogKey) return;
    if (form.formState.isDirty || fileSelection) return;

    form.reset(getDefaultValues(contract, preSelectedRequestId, proposalId));
    initializedDialogRef.current = dialogKey;
    if (fileInputRef.current) fileInputRef.current.value = "";
  }, [
    contract,
    fileSelection,
    form,
    mode,
    open,
    preSelectedRequestId,
    proposalId,
  ]);

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
    form.setValue(
      "monthlyValue",
      months > 0 ? Math.max(0, (total - initialAmount) / months) : 0,
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

  async function onSubmit(values: ContractFormValues, intent: "save" | "send") {
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
    if (!isEdit && !values.proposalId) {
      form.setError("root", { message: "اختر عرضاً معتمداً للعقد" });
      return;
    }
    if (!isEdit && !file) {
      form.setError("root", { message: "اختر ملف PDF للعقد" });
      return;
    }

    if (intent === "send" || termsChanged(values)) {
      setPendingConfirmation({ values, intent });
      return;
    }

    await submitValues(values, intent);
  }

  function termsChanged(values: ContractFormValues) {
    return Boolean(
      isEdit &&
      contract &&
      (values.type !== contract.type ||
        values.numberOfMonths !== (contract.numberOfMonths ?? undefined) ||
        values.initialPaymentRequired !== contract.initialPaymentRequired ||
        values.initialPaymentType !== (contract.downPaymentType ?? "PERCENT") ||
        values.initialPaymentValue !==
          (contract.downPaymentValue ?? undefined)),
    );
  }

  async function submitValues(
    values: ContractFormValues,
    intent: "save" | "send",
  ) {
    try {
      if (isEdit && contract) {
        await updateContract({
          id: contract.id,
          body: {
            title: values.title,
            monthlyValue: values.monthlyValue,
            totalValue: values.totalValue,
            ...(canEditTerms && termsChanged(values)
              ? {
                  type: values.type,
                  numberOfMonths:
                    values.type === ContractType.MONTHLY_RETAINER
                      ? values.numberOfMonths
                      : undefined,
                  initialPaymentRequired: values.initialPaymentRequired,
                  initialPaymentType: values.initialPaymentRequired
                    ? (values.initialPaymentType as PaymentAmountType)
                    : undefined,
                  initialPaymentValue: values.initialPaymentRequired
                    ? values.initialPaymentValue
                    : undefined,
                }
              : {}),
            startDate: values.startDate,
            endDate: values.endDate,
            file: file ?? undefined,
          },
        }).unwrap();
        toast.success("تم تحديث العقد");
        onSaved?.();
      } else if (file) {
        await createContract({
          intent: intent === "send" ? "CREATE_AND_SEND" : "DRAFT",
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
        toast.success(intent === "send" ? "تم إنشاء العقد وإرساله" : "تم حفظ مسودة العقد");
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
      setPendingConfirmation(null);
      setFileSelection(null);
      form.clearErrors();
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
    onOpenChange(nextOpen);
  }

  return (
    <>
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
                onSubmit={form.handleSubmit((values) => onSubmit(values, "save"))}
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
                  {proposalSummary ? (
                    <div className="grid gap-3 sm:grid-cols-2">
                      <div>
                        <p className="text-xs text-muted-foreground">
                          عنوان العرض
                        </p>
                        <p className="font-medium">{proposalSummary.title}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">العميل</p>
                        <p className="font-medium">
                          {selectedProposal?.client?.companyName ??
                            selectedProposal?.request?.companyName ??
                            contract?.client?.companyName ??
                            "—"}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">
                          القيمة المعتمدة
                        </p>
                        <p className="font-medium">
                          {formatCurrency(
                            (isEdit
                              ? contract?.totalValue
                              : proposalSummary.totalPrice) ?? 0,
                          )}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">الخدمات</p>
                        <p className="font-medium">
                          {proposalSummary.servicesList?.length ?? 0} خدمة
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
                            disabled={!canEditContract}
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
                          onValueChange={(value) => {
                            const nextType = value as ContractType;
                            field.onChange(nextType);
                            if (nextType === ContractType.FIXED_PROJECT) {
                              form.setValue("monthlyValue", 0, {
                                shouldDirty: true,
                              });
                              form.setValue("numberOfMonths", undefined, {
                                shouldDirty: true,
                              });
                            } else if (
                              form.getValues("numberOfMonths") == null
                            ) {
                              form.setValue("numberOfMonths", 1, {
                                shouldDirty: true,
                              });
                            }
                          }}
                          disabled={!canEditTerms}
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
                                disabled={!canEditTerms}
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
                      <h2 className="text-base font-semibold">
                        الدفعة الأولية
                      </h2>
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
                            <Checkbox
                              checked={field.value}
                              onCheckedChange={(checked) =>
                                field.onChange(checked === true)
                              }
                              disabled={!canEditTerms}
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
                                disabled={!canEditTerms}
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
                                  <SelectItem value="FIXED">
                                    مبلغ ثابت
                                  </SelectItem>
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
                                  disabled={!canEditTerms}
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
                          <Input
                            type="date"
                            {...field}
                            disabled={!canEditContract}
                          />
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
                          <Input
                            type="date"
                            {...field}
                            disabled={!canEditContract}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="flex flex-col gap-2">
                  {isEdit ? (
                    <>
                      <Label htmlFor="contract-file">
                        استبدال ملف العقد (اختياري)
                      </Label>
                      <Input
                        ref={fileInputRef}
                        id="contract-file"
                        type="file"
                        accept="application/pdf,.pdf"
                        disabled={!canEditContract}
                        aria-invalid={Boolean(form.formState.errors.root)}
                        aria-describedby="contract-file-message"
                        onChange={(event) => {
                          form.clearErrors("root");
                          const selectedFile = event.target.files?.[0];
                          setFileSelection(
                            selectedFile
                              ? { file: selectedFile, contractId: contract?.id }
                              : null,
                          );
                        }}
                      />
                      <p className="text-sm text-muted-foreground">
                        {file?.name ?? "اتركه فارغاً للإبقاء على الملف الحالي"}
                      </p>
                    </>
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
                          const selectedFile = event.target.files?.[0];
                          setFileSelection(
                            selectedFile ? { file: selectedFile } : null,
                          );
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
            {!isEdit ? (
              <Button
                type="button"
                variant="outline"
                disabled={isSubmitting || !canEditContract}
                onClick={() => void form.handleSubmit((values) => onSubmit(values, "save"))()}
              >
                {isCreating ? <Loader2 data-icon="inline-start" className="animate-spin" /> : null}
                حفظ المسودة
              </Button>
            ) : null}
            <Button
              type={isEdit ? "submit" : "button"}
              form={isEdit ? "contract-form" : undefined}
              disabled={isSubmitting || !canEditContract}
              onClick={!isEdit ? () => void form.handleSubmit((values) => onSubmit(values, "send"))() : undefined}
            >
              {isSubmitting ? (
                <Loader2 data-icon="inline-start" className="animate-spin" />
              ) : (
                <FileSignature data-icon="inline-start" />
              )}
              {isEdit ? "حفظ التعديلات" : "إنشاء وإرسال"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={Boolean(pendingConfirmation)}
        onOpenChange={(nextOpen) => {
          if (!nextOpen && !isSubmitting) setPendingConfirmation(null);
        }}
      >
        <AlertDialogContent dir="rtl">
          <AlertDialogHeader>
            <AlertDialogTitle>
              {pendingConfirmation?.intent === "send"
                ? "تأكيد إرسال العقد؟"
                : "تأكيد تغيير شروط العقد؟"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {pendingConfirmation?.intent === "send"
                ? "سيتم إرسال العقد إلى العميل ليبدأ التوقيع الإلكتروني. تأكد من اكتمال البيانات قبل المتابعة."
                : "سيؤثر تغيير نوع العقد أو شروط الدفعة على طريقة احتساب الدفعات والفواتير القادمة. راجع البيانات قبل المتابعة."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isSubmitting}>إلغاء</AlertDialogCancel>
            <AlertDialogAction
              disabled={isSubmitting}
              onClick={(event) => {
                event.preventDefault();
                if (!pendingConfirmation) return;
                const pending = pendingConfirmation;
                setPendingConfirmation(null);
                void submitValues(pending.values, pending.intent);
              }}
            >
              {isSubmitting
                ? pendingConfirmation?.intent === "send"
                  ? "جارٍ الإرسال"
                  : "جارٍ الحفظ"
                : pendingConfirmation?.intent === "send"
                  ? "تأكيد وإرسال"
                  : "تأكيد وحفظ"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
