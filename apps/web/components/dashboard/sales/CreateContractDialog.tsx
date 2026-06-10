"use client";

import { useRef, useState, useEffect, useCallback } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import {
  FileText,
  Upload,
  Copy,
  CheckCheck,
  X,
  Plus,
  Calculator,
  Calendar,
  Clock,
} from "lucide-react";
import { Dialog } from "@/components/design-system/Dialog";
import { ActionButton } from "@/components/design-system/ActionButton";
import { Skeleton } from "@/components/design-system/Skeleton";
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
import { useGetRequestsQuery } from "@/features/requests/requestsApi";
import { useCreateContractMutation } from "@/features/contracts/contractsApi";
import { ContractType, ProposalStatus, RequestStatus } from "@hassad/shared";
import { formatCurrency } from "@/lib/format";
import { useCurrency } from "@/hooks/useCurrency";
import { CurrencyDisplay } from "@/components/design-system/CurrencyDisplay";

// ── Labels ───────────────────────────────────────────────────────────────────

const TYPE_LABELS: Record<ContractType, string> = {
  [ContractType.ONE_TIME_SERVICE]: "مرة واحدة",
  [ContractType.MONTHLY_RETAINER]: "اشتراك شهري",
  [ContractType.FIXED_PROJECT]: "مشروع محدد",
};

const REQUEST_STATUS_LABELS: Record<string, string> = {
  SUBMITTED: "طلب جديد",
  QUALIFYING: "مراجعة المبيعات",
  PROPOSAL_IN_PROGRESS: "إعداد العرض",
  PROPOSAL_SENT: "تم إرسال العرض",
  NEGOTIATION: "تفاوض",
  CONTRACT_PREPARATION: "إعداد العقد",
  CONTRACT_SENT: "العقد مرسل",
  SIGNED: "تم التوقيع",
  PROJECT_CREATED: "تحول إلى مشروع",
  CANCELLED: "ملغي",
};

const CONTRACT_READY_STATUSES = new Set<RequestStatus>([
  RequestStatus.CONTRACT_PREPARATION,
  RequestStatus.CONTRACT_SENT,
]);

// ── Schema ───────────────────────────────────────────────────────────────────

const contractFormSchema = z.object({
  requestId: z.string().min(1, "اختر الطلب"),
  title: z.string().min(2, "اكتب عنوان العقد"),
  type: z.nativeEnum(ContractType, { message: "اختر نوع العقد" }),
  monthlyValue: z.number().optional(),
  totalValue: z.number().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
});

type ContractFormValues = z.infer<typeof contractFormSchema>;

// ── Component ────────────────────────────────────────────────────────────────

interface CreateContractDialogProps {
  proposalId?: string;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function CreateContractDialog({
  proposalId: initialProposalId,
  open: controlledOpen,
  onOpenChange: controlledOnOpenChange,
}: CreateContractDialogProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [shareLink, setShareLink] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [createContract, { isLoading }] = useCreateContractMutation();
  const { currency, fmtAmount } = useCurrency();

  // Proposal picker state
  const [selectedProposalId, setSelectedProposalId] = useState(
    initialProposalId ?? "",
  );
  const [proposalSearch, setProposalSearch] = useState("");

  const isControlled = controlledOpen !== undefined;
  const open = isControlled ? controlledOpen : internalOpen;

  useEffect(() => {
    if (initialProposalId && !isControlled) {
      setInternalOpen(true);
      setSelectedProposalId(initialProposalId);
    }
  }, [initialProposalId, isControlled]);

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
    },
  });

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

  const { data: requestsData, isFetching: requestsFetching } =
    useGetRequestsQuery({ limit: 100 }, { skip: !open });

  const selectedProposal = proposalsData?.items.find(
    (p) => p.id === selectedProposalId,
  );

  const contractRequests = (requestsData ?? []).filter((request) =>
    CONTRACT_READY_STATUSES.has(request.status),
  );

  // Proposal options for SearchCombobox
  const proposalOptions =
    proposalsData?.items
      .filter((p) => {
        if (!proposalSearch) return true;
        const q = proposalSearch.toLowerCase();
        return (
          p.title?.toLowerCase().includes(q) ||
          p.request?.companyName?.toLowerCase().includes(q) ||
          p.lead?.companyName?.toLowerCase().includes(q)
        );
      })
      .map((p) => ({
        id: p.id,
        label: `${p.request?.companyName ?? p.lead?.companyName ?? "—"} — ${p.title} (${fmtAmount(p.totalPrice ?? 0)} ${currency.symbol})`,
      })) ?? [];

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
    });
  }, [selectedProposal, form]);

  // ── Handlers ───────────────────────────────────────────────────────────────

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0] ?? null;
    setFile(f);
  }

  function handleDrop(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault();
    const f = e.dataTransfer.files?.[0] ?? null;
    if (f?.type === "application/pdf") setFile(f);
    else toast.error("يُقبل ملفات PDF فقط");
  }

  async function onSubmit(values: ContractFormValues) {
    if (!file) {
      toast.error("يرجى رفع ملف العقد (PDF)");
      return;
    }

    try {
      const payload: any = {
        requestId: values.requestId,
        title: values.title,
        type: values.type,
        file,
      };

      // Only send manual values when no proposal is selected
      if (!selectedProposalId) {
        payload.monthlyValue = values.monthlyValue ?? 0;
        payload.totalValue = values.totalValue ?? 0;
        payload.startDate = values.startDate ?? "";
        payload.endDate = values.endDate ?? "";
      }

      if (selectedProposalId) {
        payload.proposalId = selectedProposalId;
      }

      const result = await createContract(payload).unwrap();

      const origin =
        typeof window !== "undefined" ? window.location.origin : "";
      const token = result.shareLinkToken;
      if (token) setShareLink(`${origin}/contract/${token}`);

      toast.success("تم إنشاء العقد وإرساله إلى العميل");
      form.reset();
      setFile(null);
    } catch (err: unknown) {
      const msg =
        (err as { data?: { message?: string } })?.data?.message ??
        "فشل إنشاء العقد";
      console.error("createContract error:", err);
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
          إنشاء عقد
        </ActionButton>
      )}

      <Dialog
        open={open}
        onOpenChange={handleOpenChange}
        title="إنشاء عقد جديد"
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
                <p className="font-semibold text-base">تم إنشاء العقد وإرساله</p>
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
            <form
              onSubmit={form.handleSubmit(onSubmit)}
              className="space-y-6"
            >
              {/* Header */}
              <div className="text-center space-y-1.5">
                <h1 className="text-[22px] font-bold text-natural-100 leading-tight">
                  إنشاء عقد جديد
                </h1>
                <p className="text-[13px] text-neutral-300 leading-relaxed px-2">
                  اختر عرضاً معتمداً لإنشاء العقد تلقائياً، أو املأ البيانات
                  يدوياً
                </p>
              </div>

              {/* ── Proposal Picker ─────────────────────────────── */}
              <div>
                <h2 className="text-[15px] font-bold text-natural-100 mb-3">
                  اختيار العرض الفني
                </h2>
                <div className="border border-neutral-200 rounded-2xl p-4 space-y-4 bg-natural-0"
                >
                  <div>
                    <label className="text-[13px] font-bold text-natural-100 block mb-1.5"
                    >
                      عرض معتمد (اختياري)
                    </label>
                    <SearchCombobox
                      value={selectedProposalId}
                      onChange={setSelectedProposalId}
                      options={proposalOptions}
                      onSearchChange={setProposalSearch}
                      placeholder="اختر عرضاً معتمداً..."
                      searchPlaceholder="ابحث باسم العميل أو عنوان العرض..."
                      isLoading={proposalsFetching}
                    />
                    <p className="text-[11px] text-neutral-300 mt-1">
                      اختيار عرض معتمد يملأ البيانات تلقائياً من العرض
                    </p>
                  </div>

                  {/* Proposal summary card */}
                  {hasProposal && (
                    <div className="rounded-xl border border-neutral-200 p-4 space-y-2 bg-neutral-50"
                    >
                      <p className="text-sm font-semibold text-natural-100"
                      >
                        بيانات العرض الفني
                      </p>
                      <div className="text-sm text-neutral-300 space-y-1"
                      >
                        <p>
                          <span className="font-medium text-natural-100"
                          >
                            العميل:{" "}
                          </span>
                          {selectedProposal?.request?.companyName ??
                            selectedProposal?.lead?.companyName ??
                            "—"}
                        </p>
                        <p>
                          <span className="font-medium text-natural-100"
                          >
                            العنوان:{" "}
                          </span>
                          {selectedProposal?.title}
                        </p>
                        <div className="flex items-center gap-2"
                        >
                          <Calculator className="w-4 h-4" />
                          <span>
                            إجمالي القيمة:{" "}
                            <CurrencyDisplay
                              amount={selectedProposal?.totalPrice ?? 0}
                              className="font-bold text-natural-100"
                            />
                          </span>
                        </div>
                        <div className="flex items-center gap-2"
                        >
                          <Clock className="w-4 h-4" />
                          <span>
                            المدة:{" "}
                            {selectedProposal?.durationDays} يوم
                          </span>
                        </div>
                        <div className="flex items-center gap-2"
                        >
                          <Calendar className="w-4 h-4" />
                          <span>
                            تاريخ البداية:{" "}
                            {form.watch("startDate") || "—"}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* ── Contract Info ───────────────────────────────── */}
              <div>
                <h2 className="text-[15px] font-bold text-natural-100 mb-3"
                >
                  بيانات العقد
                </h2>
                <div className="border border-neutral-200 rounded-2xl p-4 space-y-4 bg-natural-0"
                >
                  {/* Request picker — only when no proposal */}
                  {!hasProposal && (
                    <FormField
                      control={form.control}
                      name="requestId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>الطلب</FormLabel>
                          <FormSelect
                            onValueChange={field.onChange}
                            value={field.value}
                          >
                            <FormControl>
                              <FormSelectTrigger>
                                <FormSelectValue
                                  placeholder={
                                    requestsFetching
                                      ? "جارٍ التحميل..."
                                      : contractRequests.length === 0
                                        ? "لا توجد طلبات جاهزة"
                                        : "اختر الطلب"
                                  }
                                />
                              </FormSelectTrigger>
                            </FormControl>
                            <FormSelectContent>
                              {contractRequests.map((request) => (
                                <FormSelectItem
                                  key={request.id}
                                  value={request.id}
                                >
                                  {request.companyName}
                                  {request.contactName
                                    ? ` — ${request.contactName}`
                                    : ""}
                                  {" "}
                                  (
                                  {REQUEST_STATUS_LABELS[request.status] ??
                                    request.status}
                                  )
                                </FormSelectItem>
                              ))}
                            </FormSelectContent>
                          </FormSelect>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}

                  {/* Hidden requestId when proposal selected */}
                  {hasProposal && (
                    <input
                      type="hidden"
                      {...form.register("requestId")}
                    />
                  )}

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

                  {/* Values — only when no proposal */}
                  {!hasProposal && (
                    <div className="grid grid-cols-2 gap-3">
                      <FormField
                        control={form.control}
                        name="monthlyValue"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>القيمة الشهرية ({currency.symbol})</FormLabel>
                            <FormControl>
                              <FormInputControl
                                type="number"
                                min="0"
                                step="0.01"
                                {...field}
                                value={field.value ?? ""}
                                onChange={(e) => {
                                  const n = e.target.valueAsNumber;
                                  field.onChange(
                                    Number.isNaN(n) ? undefined : n,
                                  );
                                }}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="totalValue"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>إجمالي القيمة ({currency.symbol})</FormLabel>
                            <FormControl>
                              <FormInputControl
                                type="number"
                                min="0"
                                step="0.01"
                                {...field}
                                value={field.value ?? ""}
                                onChange={(e) => {
                                  const n = e.target.valueAsNumber;
                                  field.onChange(
                                    Number.isNaN(n) ? undefined : n,
                                  );
                                }}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  )}

                  {/* Total display when proposal selected */}
                  {hasProposal && (
                    <div className="bg-neutral-50 rounded-xl px-5 py-4 flex items-center justify-between"
                    >
                      <span className="text-[15px] font-bold text-natural-100"
                      >
                      <CurrencyDisplay
                        amount={selectedProposal?.totalPrice ?? 0}
                        className="text-[15px] font-bold text-natural-100"
                      />
                      </span>
                      <span className="text-[14px] font-bold text-natural-100"
                      >
                        الإجمالي الكلي
                      </span>
                    </div>
                  )}

                  {/* Dates — only when no proposal */}
                  {!hasProposal && (
                    <div className="grid grid-cols-2 gap-3">
                      <FormField
                        control={form.control}
                        name="startDate"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>تاريخ البداية</FormLabel>
                            <FormControl>
                              <FormInputControl type="date" {...field} />
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
                              <FormInputControl type="date" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  )}

                  {/* PDF Upload */}
                  <div>
                    <p className="text-[13px] font-bold text-natural-100 mb-1.5"
                    >
                      ملف العقد (PDF)
                      <span className="text-danger-500 mr-1">*</span>
                    </p>
                    <div
                      className="flex items-center gap-3 rounded-xl border border-neutral-200 h-12 px-4 cursor-pointer hover:bg-neutral-50 transition-colors"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <FileText className="w-4 h-4 text-neutral-200 shrink-0" />
                      <span className="text-[13px] text-neutral-300 flex-1 truncate"
                      >
                        {file
                          ? file.name
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
                  loading={isLoading}
                  disabled={!file}
                  className="flex-1 h-14 text-[15px] font-semibold"
                >
                  {isLoading ? "جارٍ الإرسال..." : "إنشاء وإرسال"}
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
