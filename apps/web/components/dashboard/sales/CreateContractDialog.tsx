"use client";

import { useRef, useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { FileText, CheckCheck, X, Calculator, Calendar, Clock } from "lucide-react";
import { Dialog } from "@/components/design-system/Dialog";
import { ActionButton } from "@/components/design-system/ActionButton";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/design-system/Form";
import { FormInputControl } from "@/components/design-system/FormInputControl";
import {
  FormSelect,
  FormSelectContent,
  FormSelectItem,
  FormSelectTrigger,
  FormSelectValue,
} from "@/components/design-system/FormSelectControl";
import { SearchCombobox } from "@/components/common/SearchCombobox";
import { useGetProposalsQuery } from "@/features/proposals/proposalsApi";
import {
  useCreateContractMutation,
  useUpdateContractMutation,
  type ContractItem,
} from "@/features/contracts/contractsApi";
import {
  ContractType,
  PaymentAmountType,
  ProposalStatus,
} from "@hassad/shared";
import { useCurrency } from "@/hooks/useCurrency";
import { CurrencyDisplay } from "@/components/design-system/CurrencyDisplay";

// ── Labels ───────────────────────────────────────────────────────────────────

const TYPE_LABELS: Record<ContractType, string> = {
  [ContractType.ONE_TIME_SERVICE]: "مرة واحدة",
  [ContractType.MONTHLY_RETAINER]: "اشتراك شهري",
  [ContractType.FIXED_PROJECT]: "مشروع محدد",
};



// ── Schema ───────────────────────────────────────────────────────────────────

const contractFormSchema = z.object({
  requestId: z.string().min(1, "اختر الطلب"),
  title: z.string().min(2, "اكتب عنوان العقد"),
  type: z.nativeEnum(ContractType, { message: "اختر نوع العقد" }),
  monthlyValue: z.number().optional(),
  totalValue: z.number().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  downPaymentType: z.nativeEnum(PaymentAmountType).optional(),
  downPaymentValue: z.number().optional(),
  numberOfMonths: z.number().optional(),
});

type ContractFormValues = z.infer<typeof contractFormSchema>;

// ── Component ────────────────────────────────────────────────────────────────

interface CreateContractDialogProps {
  proposalId?: string;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  /** "create" (default) or "edit" */
  mode?: "create" | "edit";
  /** Existing contract data for edit mode */
  contract?: ContractItem | null;
  /** Pre-select a request (used from pipeline) */
  preSelectedRequestId?: string;
}

export function CreateContractDialog({
  proposalId: initialProposalId,
  open: controlledOpen,
  onOpenChange: controlledOnOpenChange,
  mode = "create",
  contract,
  preSelectedRequestId,
}: CreateContractDialogProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [shareLink, setShareLink] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [createContract, { isLoading }] = useCreateContractMutation();
  const [updateContract, { isLoading: isUpdating }] =
    useUpdateContractMutation();
  const isEdit = mode === "edit";
  const isSubmitting = isEdit ? isUpdating : isLoading;
  const { currency, fmtAmount } = useCurrency();

  // Proposal picker state
  const [selectedProposalId, setSelectedProposalId] = useState(
    initialProposalId ?? "",
  );
  const [proposalSearch, setProposalSearch] = useState("");

  const isControlled = controlledOpen !== undefined;
  const open = isControlled ? controlledOpen : internalOpen;

  const form = useForm<ContractFormValues>({
    resolver: zodResolver(contractFormSchema),
    defaultValues: {
      requestId: "",
      title: "",
      type: undefined,
      monthlyValue: undefined,
      totalValue: undefined,
      startDate: "",
      endDate: "",
      downPaymentType: undefined,
      downPaymentValue: undefined,
      numberOfMonths: undefined,
    },
  });

  // Auto-open when preSelectedRequestId is provided (pipeline flow)
  useEffect(() => {
    if (preSelectedRequestId && !isControlled) {
      setInternalOpen(true);
    }
  }, [preSelectedRequestId, isControlled]);

  useEffect(() => {
    if (initialProposalId && !isControlled) {
      setInternalOpen(true);
      setSelectedProposalId(initialProposalId);
    }
  }, [initialProposalId, isControlled]);

  // ── Pre-fill for edit mode ────────────────────────────────────────────
  useEffect(() => {
    if (!open || !isEdit || !contract) return;
    form.reset({
      requestId: contract.clientId || "",
      title: contract.title ?? "",
      type: contract.type ?? undefined,
      monthlyValue: contract.monthlyValue ?? undefined,
      totalValue: contract.totalValue ?? undefined,
      startDate: contract.startDate
        ? typeof contract.startDate === "string"
          ? contract.startDate.split("T")[0]
          : ""
        : "",
      endDate: contract.endDate
        ? typeof contract.endDate === "string"
          ? contract.endDate.split("T")[0]
          : ""
        : "",
    });
    setFile(null);
    setSelectedProposalId(contract.proposalId ?? "");
  }, [open, isEdit, contract, form]);

  function handleOpenChange(val: boolean) {
    if (isControlled) {
      controlledOnOpenChange?.(val);
    } else {
      setInternalOpen(val);
    }
    if (!val) {
      setShareLink(null);
      setCopied(false);
      form.reset();
      setFile(null);
      setSelectedProposalId("");
      setProposalSearch("");
    }
  }

  // ── Data fetching ──────────────────────────────────────────────────────────

  const { data: proposalsData, isFetching: proposalsFetching } =
    useGetProposalsQuery(
      { status: ProposalStatus.APPROVED, limit: 100 },
      { skip: !open },
    );

  const selectedProposal = proposalsData?.items.find(
    (p) => p.id === selectedProposalId,
  );

  // Proposal options for SearchCombobox — filter by request when preSelected
  const proposalOptions = (() => {
    let items = proposalsData?.items ?? [];

    // When coming from pipeline, only show proposals linked to that request
    if (preSelectedRequestId) {
      items = items.filter((p) => p.requestId === preSelectedRequestId);
    }

    if (proposalSearch) {
      const q = proposalSearch.toLowerCase();
      items = items.filter(
        (p) =>
          p.title?.toLowerCase().includes(q) ||
          p.request?.companyName?.toLowerCase().includes(q) ||
          p.lead?.companyName?.toLowerCase().includes(q),
      );
    }

    return items.map((p) => ({
      id: p.id,
      label: `${p.request?.companyName ?? p.lead?.companyName ?? "—"} — ${p.title} (${fmtAmount(p.totalPrice ?? 0)} ${currency.symbol})`,
    }));
  })();

  // ── Auto-select proposal from pipeline ──────────────────────────────
  useEffect(() => {
    if (!open || isEdit || !preSelectedRequestId) return;
    // Find the approved proposal linked to this request and auto-select it
    const matchingProposal = proposalsData?.items.find(
      (p) =>
        p.requestId === preSelectedRequestId &&
        p.status === ProposalStatus.APPROVED,
    );
    if (matchingProposal && !selectedProposalId) {
      setSelectedProposalId(matchingProposal.id);
    }
  }, [open, isEdit, preSelectedRequestId, proposalsData, selectedProposalId]);

  // ── Auto-fill when proposal selected ───────────────────────────────────────

  useEffect(() => {
    if (!selectedProposal) {
      form.reset({
        requestId: "",
        title: "",
        type: undefined,
        monthlyValue: undefined,
        totalValue: undefined,
        startDate: "",
        endDate: "",
      });
      return;
    }

    const start = selectedProposal.startDate
      ? typeof selectedProposal.startDate === "string"
        ? selectedProposal.startDate.split("T")[0]
        : ""
      : new Date().toISOString().split("T")[0];

    const end = new Date(start);
    end.setDate(end.getDate() + (selectedProposal.durationDays || 30));

    form.reset({
      requestId: selectedProposal.requestId ?? "",
      title: selectedProposal.title ?? "",
      type: ContractType.ONE_TIME_SERVICE,
      monthlyValue: undefined,
      totalValue: selectedProposal.totalPrice ?? 0,
      startDate: start,
      endDate: end.toISOString().split("T")[0],
      downPaymentType: undefined,
      downPaymentValue: undefined,
      numberOfMonths: undefined,
    });
  }, [selectedProposal, form]);

  // ── Auto-suggest numberOfMonths when type → MONTHLY_RETAINER ──────────
  const watchedType = form.watch("type");
  useEffect(() => {
    if (
      watchedType === ContractType.MONTHLY_RETAINER &&
      selectedProposal?.durationDays
    ) {
      const months = Math.round(selectedProposal.durationDays / 30);
      if (months > 0 && !form.getValues("numberOfMonths")) {
        form.setValue("numberOfMonths", months);
      }
    }
  }, [watchedType, selectedProposal, form]);

  // ── Handlers ───────────────────────────────────────────────────────────────

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0] ?? null;
    setFile(f);
  }

  async function onSubmit(values: ContractFormValues) {
    // Proposal required for create mode
    if (!isEdit && !hasProposal) {
      toast.error("يرجى اختيار عرض معتمد أولاً");
      return;
    }
    // PDF required for create, optional for edit
    if (!isEdit && !file) {
      toast.error("يرجى رفع ملف العقد (PDF)");
      return;
    }

    try {
      if (isEdit && contract) {
        // Edit mode: use updateContract
        const body: any = {
          title: values.title,
          type: values.type,
        };
        if (!selectedProposalId) {
          body.monthlyValue = values.monthlyValue ?? 0;
          body.totalValue = values.totalValue ?? 0;
          body.startDate = values.startDate ?? "";
          body.endDate = values.endDate ?? "";
        }
        await updateContract({ id: contract.id, body }).unwrap();
        toast.success("تم تحديث العقد بنجاح");
        handleOpenChange(false);
      } else {
        // Create mode
        const payload: any = {
          requestId: values.requestId,
          title: values.title,
          type: values.type,
          file,
          proposalId: selectedProposalId,
          downPaymentType:
            values.type === ContractType.MONTHLY_RETAINER
              ? values.downPaymentType
              : undefined,
          downPaymentValue:
            values.type === ContractType.MONTHLY_RETAINER
              ? values.downPaymentValue
              : undefined,
          numberOfMonths:
            values.type === ContractType.MONTHLY_RETAINER
              ? values.numberOfMonths
              : undefined,
        };

        const result = await createContract(payload).unwrap();

        const origin =
          typeof window !== "undefined" ? window.location.origin : "";
        const token = result.shareLinkToken;
        if (token) setShareLink(`${origin}/contract/${token}`);

        toast.success("تم إنشاء العقد وإرساله إلى العميل");
        form.reset();
        setFile(null);
      }
    } catch (err: unknown) {
      const msg =
        (err as { data?: { message?: string } })?.data?.message ??
        (isEdit ? "فشل تحديث العقد" : "فشل إنشاء العقد");
      globalThis.console.error("contract error:", err);
      toast.error(msg);
    }
  }

  async function copyLink() {
    if (!shareLink) return;
    await navigator.clipboard.writeText(shareLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  const hasProposal = !!selectedProposalId && !!selectedProposal;

  // ── Render ───────────────────────────────────────────────────────────────────

  return (
    <>
      {!isControlled && (
        <ActionButton variant="primary" onClick={() => setInternalOpen(true)}>
          {isEdit ? "تعديل العقد" : "إنشاء عقد"}
        </ActionButton>
      )}

      <Dialog
        open={open}
        onOpenChange={handleOpenChange}
        title={isEdit ? "تعديل العقد" : "إنشاء عقد جديد"}
        contentClassName="sm:max-w-[520px] p-0 gap-0 rounded-[24px] overflow-hidden"
        className="space-y-6 max-h-[90vh] overflow-y-auto modal-scroll p-6"
      >
        {/* ── Success state ──────────────────────────────────── */}
        {shareLink ? (
          <div className="space-y-5 py-2">
            <div className="flex flex-col items-center gap-3 py-4 text-center">
              <div className="h-14 w-14 rounded-full bg-success-100 flex items-center justify-center">
                <CheckCheck className="h-7 w-7 text-success-600" />
              </div>
              <div>
                <p className="font-semibold text-base">
                  تم إنشاء العقد وإرساله
                </p>
                <p className="text-sm text-neutral-300 mt-1">
                  شارك رابط التوقيع مع العميل ليوقّع إلكترونياً
                </p>
              </div>
            </div>

            <div className="min-w-0">
              <div className="relative w-full">
                <FormInputControl
                  readOnly
                  value={shareLink ?? ""}
                  dir="ltr"
                  className="w-full h-12 px-4 pr-36 text-xs font-mono truncate bg-neutral-50"
                />
                <div className="absolute inset-y-0 right-2 flex items-center">
                  <ActionButton
                    size="sm"
                    variant={copied ? "secondary" : "primary"}
                    onClick={copyLink}
                    className="px-4 py-2 text-[13px] rounded-lg"
                  >
                    {copied ? "تم النسخ ✓" : "نسخ الرابط"}
                  </ActionButton>
                </div>
              </div>
            </div>

            <ActionButton
              variant="outline"
              className="w-full"
              onClick={() => handleOpenChange(false)}
            >
              إغلاق
            </ActionButton>
          </div>
        ) : (
          /* ── Form ─────────────────────────────────────────── */
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {/* Header */}
              <div className="text-center space-y-1.5">
                <h1 className="text-[22px] font-bold text-natural-100 leading-tight">
                  {isEdit ? "تعديل العقد" : "إنشاء عقد جديد"}
                </h1>
                <p className="text-[13px] text-neutral-300 leading-relaxed px-2">
                  {isEdit
                    ? "عدّل بيانات العقد الحالي"
                    : "اختر عرضاً معتمداً لإنشاء العقد تلقائياً"}
                </p>
              </div>

              {/* ── Proposal Picker ─────────────────────────────── */}
              <div>
                <h2 className="text-[15px] font-bold text-natural-100 mb-3">
                  اختيار العرض الفني
                </h2>
                <div className="border border-neutral-200 rounded-2xl p-4 space-y-4 bg-natural-0">
                  <div>
                    <label className="text-[13px] font-bold text-natural-100 block mb-1.5">
                      عرض معتمد
                      {!isEdit && (
                        <span className="text-danger-500 mr-1">*</span>
                      )}
                    </label>
                    <SearchCombobox
                      value={selectedProposalId}
                      onChange={setSelectedProposalId}
                      options={proposalOptions}
                      onSearchChange={setProposalSearch}
                      placeholder="اختر عرضاً معتمداً..."
                      searchPlaceholder="ابحث باسم العميل أو عنوان العرض..."
                      isLoading={proposalsFetching}
                      disabled={isEdit}
                    />
                    {!isEdit && (
                      <p className="text-[11px] text-neutral-300 mt-1">
                        اختيار عرض معتمد يملأ البيانات تلقائياً من العرض
                      </p>
                    )}
                  </div>

                  {/* Proposal summary card */}
                  {hasProposal && (
                    <div className="rounded-xl border border-neutral-200 p-4 space-y-2 bg-neutral-50">
                      <p className="text-sm font-semibold text-natural-100">
                        بيانات العرض الفني
                      </p>
                      <div className="text-sm text-neutral-300 space-y-1">
                        <p>
                          <span className="font-medium text-natural-100">
                            العميل:{" "}
                          </span>
                          {selectedProposal?.request?.companyName ??
                            selectedProposal?.lead?.companyName ??
                            "—"}
                        </p>
                        <p>
                          <span className="font-medium text-natural-100">
                            العنوان:{" "}
                          </span>
                          {selectedProposal?.title}
                        </p>
                        <div className="flex items-center gap-2">
                          <Calculator className="w-4 h-4" />
                          <span>
                            إجمالي القيمة:{" "}
                            <CurrencyDisplay
                              amount={selectedProposal?.totalPrice ?? 0}
                              className="font-bold text-natural-100"
                            />
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4" />
                          <span>
                            المدة: {selectedProposal?.durationDays} يوم
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4" />
                          <span>
                            تاريخ البداية: {form.watch("startDate") || "—"}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* ── Contract Info ───────────────────────────────── */}
              <div>
                <h2 className="text-[15px] font-bold text-natural-100 mb-3">
                  بيانات العقد
                </h2>
                <div className="border border-neutral-200 rounded-2xl p-4 space-y-4 bg-natural-0">
                  {/* Hidden requestId from proposal */}
                  <input type="hidden" {...form.register("requestId")} />

                  <FormField
                    control={form.control}
                    name="title"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>عنوان العقد</FormLabel>
                        <FormControl>
                          <FormInputControl
                            placeholder="عقد خدمات التسويق الرقمي..."
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
                        <FormSelect
                          onValueChange={field.onChange}
                          value={field.value}
                        >
                          <FormControl>
                            <FormSelectTrigger>
                              <FormSelectValue placeholder="اختر النوع" />
                            </FormSelectTrigger>
                          </FormControl>
                          <FormSelectContent>
                            {(
                              Object.values(ContractType) as ContractType[]
                            ).map((t) => (
                              <FormSelectItem key={t} value={t}>
                                {TYPE_LABELS[t]}
                              </FormSelectItem>
                            ))}
                          </FormSelectContent>
                        </FormSelect>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Total display */}
                  <div className="bg-neutral-50 rounded-xl px-5 py-4 flex items-center justify-between">
                    <span className="text-[15px] font-bold text-natural-100">
                      <CurrencyDisplay
                        amount={selectedProposal?.totalPrice ?? 0}
                        className="text-[15px] font-bold text-natural-100"
                      />
                    </span>
                    <span className="text-[14px] font-bold text-natural-100">
                      الإجمالي الكلي
                    </span>
                  </div>

                  {/* PDF Upload */}
                  <div>
                    <p className="text-[13px] font-bold text-natural-100 mb-1.5">
                      ملف العقد (PDF)
                      {!isEdit && (
                        <span className="text-danger-500 mr-1">*</span>
                      )}
                    </p>
                    <div
                      className="flex items-center gap-3 rounded-xl border border-neutral-200 h-12 px-4 cursor-pointer hover:bg-neutral-50 transition-colors"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <FileText className="w-4 h-4 text-neutral-200 shrink-0" />
                      <span className="text-[13px] text-neutral-300 flex-1 truncate">
                        {file
                          ? file.name
                          : isEdit
                            ? "اختر ملف PDF جديد (اتركه فارغاً للإبقاء على الملف الحالي)"
                            : "انقر لاختيار ملف PDF..."}
                      </span>
                      {file && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setFile(null);
                            if (fileInputRef.current)
                              fileInputRef.current.value = "";
                          }}
                          className="shrink-0 text-neutral-200 hover:text-danger-500 transition-colors"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="application/pdf,.pdf"
                      className="hidden"
                      onChange={handleFileChange}
                    />
                  </div>

                  {/* ── Billing fields (MONTHLY_RETAINER only) ───── */}
                  {form.watch("type") === ContractType.MONTHLY_RETAINER && (
                    <div className="border-t border-neutral-200 pt-4 space-y-4">
                      <p className="text-[14px] font-bold text-natural-100">
                        إعدادات الدفع
                      </p>

                      <div className="grid grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name="downPaymentType"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>نوع الدفعة الأولى</FormLabel>
                              <FormSelect
                                onValueChange={field.onChange}
                                value={field.value}
                              >
                                <FormControl>
                                  <FormSelectTrigger>
                                    <FormSelectValue placeholder="اختر النوع" />
                                  </FormSelectTrigger>
                                </FormControl>
                                <FormSelectContent>
                                  <FormSelectItem
                                    value={PaymentAmountType.PERCENT}
                                  >
                                    نسبة مئوية (%)
                                  </FormSelectItem>
                                  <FormSelectItem
                                    value={PaymentAmountType.FIXED}
                                  >
                                    مبلغ ثابت (ر.س)
                                  </FormSelectItem>
                                </FormSelectContent>
                              </FormSelect>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="downPaymentValue"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>
                                {form.watch("downPaymentType") ===
                                PaymentAmountType.PERCENT
                                  ? "نسبة الدفعة الأولى (%)"
                                  : "قيمة الدفعة الأولى (ر.س)"}
                              </FormLabel>
                              <FormControl>
                                <FormInputControl
                                  type="number"
                                  min={0}
                                  placeholder={
                                    form.watch("downPaymentType") ===
                                    PaymentAmountType.PERCENT
                                      ? "مثال: 20"
                                      : "مثال: 5000"
                                  }
                                  {...field}
                                  onChange={(e) =>
                                    field.onChange(
                                      e.target.valueAsNumber || undefined,
                                    )
                                  }
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <FormField
                        control={form.control}
                        name="numberOfMonths"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>عدد الأشهر</FormLabel>
                            <FormControl>
                              <FormInputControl
                                type="number"
                                min={1}
                                placeholder="مثال: 6"
                                {...field}
                                onChange={(e) =>
                                  field.onChange(
                                    e.target.valueAsNumber || undefined,
                                  )
                                }
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  )}
                </div>
              </div>

              {/* ── Buttons row ─────────────────────────────── */}
              <div className="flex gap-3">
                <ActionButton
                  variant="outline"
                  type="button"
                  onClick={() => handleOpenChange(false)}
                  className="w-[30%] h-14 text-[13px] font-medium"
                >
                  إلغاء
                </ActionButton>
                <ActionButton
                  type="submit"
                  variant="submit"
                  size="lg"
                  loading={isSubmitting}
                  disabled={(!isEdit && !file) || (!isEdit && !hasProposal)}
                  className="flex-1 h-14 text-[15px] font-semibold"
                >
                  {isSubmitting
                    ? "جارٍ الإرسال..."
                    : isEdit
                      ? "تحديث العقد"
                      : "إنشاء وإرسال"}
                </ActionButton>
              </div>
            </form>
          </Form>
        )}

        <style
          dangerouslySetInnerHTML={{
            __html: `
          .modal-scroll::-webkit-scrollbar { width: 6px; }
          .modal-scroll::-webkit-scrollbar-track { background: transparent; }
          .modal-scroll::-webkit-scrollbar-thumb { background-color: #e5e7eb; border-radius: 20px; }
          .modal-scroll::-webkit-scrollbar-thumb:hover { background-color: #d1d5db; }
          [role="dialog"] > button.absolute { display: none !important; }
        `,
          }}
        />
      </Dialog>
    </>
  );
}
