"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useForm, useWatch, type FieldPath } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { FileSignature, Loader2 } from "lucide-react";
import { ContractType, ProposalStatus } from "@hassad/shared";
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

const contractFormSchema = z
  .object({
    requestId: z.string().min(1, "الطلب المرتبط مطلوب"),
    proposalId: z.string().optional(),
    title: z.string().trim().min(2, "اكتب عنوان العقد"),
    type: z.nativeEnum(ContractType),
    monthlyValue: z.coerce.number().nonnegative().optional(),
    totalValue: z.coerce.number().nonnegative().optional(),
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
  mode?: "create" | "edit";
  contract?: ContractItem | null;
  preSelectedRequestId?: string;
}

const contractTypeLabels: Record<ContractType, string> = {
  [ContractType.ONE_TIME_SERVICE]: "خدمة لمرة واحدة",
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
    type: contract?.type ?? ContractType.ONE_TIME_SERVICE,
    monthlyValue: contract?.monthlyValue ?? 0,
    totalValue: contract?.totalValue ?? 0,
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
      } else if (file) {
        await createContract({
          requestId: values.requestId,
          title: values.title,
          type: values.type,
          monthlyValue: values.monthlyValue,
          totalValue: values.totalValue,
          startDate: values.startDate,
          endDate: values.endDate,
          proposalId: values.proposalId || undefined,
          file,
        }).unwrap();
        toast.success("تم إنشاء العقد");
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
              <Card>
                <CardHeader className="gap-1">
                  <CardTitle className="text-base">الربط الأساسي</CardTitle>
                  <CardDescription>
                    اختر العرض المعتمد ليتم ربط العقد بالفرصة الصحيحة.
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex flex-col gap-4">
                  <FormField
                    control={form.control}
                    name="proposalId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>العرض المعتمد</FormLabel>
                        <Select
                          value={field.value}
                          onValueChange={field.onChange}
                          disabled={
                            isEdit || proposalsLoading || Boolean(proposalId)
                          }
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="اختر العرض" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectGroup>
                              {proposalOptions.map((proposal) => (
                                <SelectItem
                                  key={proposal.id}
                                  value={proposal.id}
                                >
                                  {proposal.title} —{" "}
                                  {proposal.request?.companyName ?? "طلب"}
                                </SelectItem>
                              ))}
                            </SelectGroup>
                          </SelectContent>
                        </Select>
                        <FormDescription>
                          {proposalsLoading
                            ? "جارٍ تحميل العروض..."
                            : "تظهر العروض المعتمدة فقط."}
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="requestId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>معرف الطلب</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            readOnly={isEdit || Boolean(selectedProposalId)}
                            dir="ltr"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>

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
                <FormField
                  control={form.control}
                  name="totalValue"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>القيمة الإجمالية</FormLabel>
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
                  name="monthlyValue"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>القيمة الشهرية</FormLabel>
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
          <ActionButton
            type="button"
            variant="outline"
            onClick={() => handleOpenChange(false)}
          >
            إلغاء
          </ActionButton>
          <ActionButton type="submit" form="contract-form" disabled={isSubmitting}>
            {isSubmitting ? (
              <Loader2 data-icon="inline-start" className="animate-spin" />
            ) : (
              <FileSignature data-icon="inline-start" />
            )}
            {isEdit ? "حفظ التعديلات" : "إنشاء العقد"}
          </ActionButton>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
