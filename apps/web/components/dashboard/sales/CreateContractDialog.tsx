"use client";

import { useRef, useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
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
import { useGetRequestsQuery } from "@/features/requests/requestsApi";
import { useCreateContractMutation } from "@/features/contracts/contractsApi";
import { useGetProposalByIdQuery } from "@/features/proposals/proposalsApi";
import { ContractServicesTable } from "@/components/shared/ContractServicesTable";
import { ContractType, RequestStatus } from "@hassad/shared";
import {
  FileText,
  Upload,
  Copy,
  CheckCheck,
  Calculator,
  Calendar,
  Clock,
} from "lucide-react";

// ── Labels ─────────────────────────────────────────────────────────────────────

const TYPE_LABELS: Record<ContractType, string> = {
  [ContractType.ONE_TIME_SERVICE]: "مرة واحدة",
  [ContractType.MONTHLY_RETAINER]: "اشتراك شهري",
  [ContractType.FIXED_PROJECT]: "مشروع محدد",
};

// ── Schema ─────────────────────────────────────────────────────────────────────

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

const CONTRACT_READY_STATUSES = new Set<RequestStatus>([
  RequestStatus.CONTRACT_PREPARATION,
  RequestStatus.CONTRACT_SENT,
]);

// ── Component ─────────────────────────────────────────────────────────────────

interface CreateContractDialogProps {
  proposalId?: string;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function CreateContractDialog({
  proposalId,
  open: controlledOpen,
  onOpenChange: controlledOnOpenChange,
}: CreateContractDialogProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [shareLink, setShareLink] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [createContract, { isLoading }] = useCreateContractMutation();

  const isControlled = controlledOpen !== undefined;
  const open = isControlled ? controlledOpen : internalOpen;

  useEffect(() => {
    if (proposalId && !isControlled) {
      setInternalOpen(true);
    }
  }, [proposalId, isControlled]);

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
    }
  }

  const { data: requestsData, isFetching: requestsFetching } =
    useGetRequestsQuery({ limit: 100 }, { skip: !open });

  const { data: proposalData, isLoading: proposalLoading } =
    useGetProposalByIdQuery(proposalId ?? "", {
      skip: !proposalId || !open,
    });

  const contractRequests = (requestsData ?? []).filter((request) =>
    CONTRACT_READY_STATUSES.has(request.status),
  );

  const isFromProposal = !!proposalId;

  useEffect(() => {
    if (!proposalData || !open) return;

    const endDate = new Date();
    endDate.setDate(endDate.getDate() + (proposalData.durationDays || 30));

    form.reset({
      requestId: proposalData.requestId ?? "",
      title: proposalData.title ?? "",
      type: ContractType.ONE_TIME_SERVICE,
      monthlyValue: undefined,
      totalValue: proposalData.totalPrice ?? 0,
      startDate: new Date().toISOString().split("T")[0],
      endDate: endDate.toISOString().split("T")[0],
    });
  }, [proposalData, open, form]);

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

      if (!isFromProposal) {
        payload.monthlyValue = values.monthlyValue ?? 0;
        payload.totalValue = values.totalValue ?? 0;
        payload.startDate = values.startDate ?? "";
        payload.endDate = values.endDate ?? "";
      }

      if (proposalId) {
        payload.proposalId = proposalId;
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
        title={isFromProposal ? "إنشاء عقد من العرض الفني" : "عقد جديد"}
        contentClassName="sm:max-w-lg"
      >
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
                  className="w-full pr-36 text-xs font-mono truncate"
                />
                <div className="absolute inset-y-0 right-2 flex items-center">
                  <ActionButton
                    size="sm"
                    variant={copied ? "secondary" : "primary"}
                    onClick={copyLink}
                    icon={
                      copied ? (
                        <CheckCheck className="w-3.5 h-3.5" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )
                    }
                  >
                    {copied ? "تم النسخ" : "نسخ الرابط"}
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
        ) : isFromProposal ? (
          <div className="space-y-4">
            {proposalLoading ? (
              <div className="space-y-3">
                <Skeleton className="h-5 w-32" />
                <Skeleton className="h-20 w-full" />
                <Skeleton className="h-5 w-40" />
                <Skeleton className="h-5 w-40" />
              </div>
            ) : (
              <>
                <div className="rounded-xl border p-4 space-y-2 bg-neutral-50">
                  <p className="text-sm font-semibold">معلومات العرض الفني</p>
                  <div className="text-sm text-neutral-300 space-y-1">
                    <p>
                      <span className="font-medium text-natural-100">
                        العميل:{" "}
                      </span>
                      {proposalData?.request?.companyName ??
                        proposalData?.lead?.companyName ??
                        "—"}
                    </p>
                    <p>
                      <span className="font-medium text-natural-100">
                        العنوان:{" "}
                      </span>
                      {proposalData?.title}
                    </p>
                    <div className="flex items-center gap-2">
                      <Calculator className="w-4 h-4" />
                      <span>
                        إجمالي القيمة:{" "}
                        <span className="font-bold text-natural-100">
                          {proposalData?.totalPrice?.toLocaleString("en-US")}{" "}
                          ر.س
                        </span>
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4" />
                      <span>المدة: {proposalData?.durationDays} يوم</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      <span>
                        تاريخ البداية:{" "}
                        {new Date().toLocaleDateString("ar-SA-u-nu-latn")}
                      </span>
                    </div>
                  </div>
                </div>

                {proposalData?.servicesList &&
                  proposalData.servicesList.length > 0 && (
                    <ContractServicesTable
                      services={proposalData.servicesList}
                      totalValue={proposalData.totalPrice}
                    />
                  )}

                <p className="text-xs text-neutral-300 text-center">
                  تم اعتماد هذه القيم من قبل العميل في العرض الفني. لا يمكنك
                  تعديلها من هنا.
                </p>
              </>
            )}

            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(onSubmit)}
                className="space-y-4 pt-2"
              >
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
                          {(Object.values(ContractType) as ContractType[]).map(
                            (t) => (
                              <FormSelectItem key={t} value={t}>
                                {TYPE_LABELS[t]}
                              </FormSelectItem>
                            ),
                          )}
                        </FormSelectContent>
                      </FormSelect>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div>
                  <p className="text-sm font-medium mb-1.5">ملف العقد (PDF)</p>
                  <div
                    role="button"
                    tabIndex={0}
                    className="flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed p-5 cursor-pointer hover:bg-neutral-50 transition-colors"
                    onClick={() => fileInputRef.current?.click()}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ")
                        fileInputRef.current?.click();
                    }}
                    onDrop={handleDrop}
                    onDragOver={(e) => e.preventDefault()}
                  >
                    {file ? (
                      <>
                        <FileText className="w-8 h-8 text-action-blue" />
                        <p className="text-sm font-medium">{file.name}</p>
                        <p className="text-xs text-neutral-300">
                          {(file.size / 1024).toFixed(0)} KB
                        </p>
                      </>
                    ) : (
                      <>
                        <Upload className="w-7 h-7 text-neutral-300" />
                        <p className="text-sm text-neutral-300">
                          اسحب الملف هنا أو انقر للاختيار
                        </p>
                      </>
                    )}
                  </div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="application/pdf"
                    className="hidden"
                    onChange={handleFileChange}
                  />
                </div>

                <div className="flex justify-end gap-2">
                  <ActionButton
                    type="button"
                    variant="outline"
                    onClick={() => handleOpenChange(false)}
                    disabled={isLoading}
                  >
                    إلغاء
                  </ActionButton>
                  <ActionButton
                    type="submit"
                    variant="primary"
                    loading={isLoading}
                    disabled={!file}
                  >
                    {isLoading ? "جارٍ الإرسال..." : "إنشاء وإرسال"}
                  </ActionButton>
                </div>
              </form>
            </Form>
          </div>
        ) : (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="requestId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>الطلب (مرحلة إعداد العقد)</FormLabel>
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
                                  ? "لا توجد طلبات في مرحلة العقد"
                                  : "اختر الطلب"
                            }
                          />
                        </FormSelectTrigger>
                      </FormControl>
                      <FormSelectContent>
                        {contractRequests.map((request) => (
                          <FormSelectItem key={request.id} value={request.id}>
                            {request.companyName}
                            {request.contactName
                              ? ` — ${request.contactName}`
                              : ""}
                          </FormSelectItem>
                        ))}
                      </FormSelectContent>
                    </FormSelect>
                    <p className="text-xs text-neutral-300">
                      يعرض هذا الحقل الطلبات الموجودة حالياً في مسار إعداد العقد
                      أو المرسلة للتوقيع
                    </p>
                    <FormMessage />
                  </FormItem>
                )}
              />

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
                        {(Object.values(ContractType) as ContractType[]).map(
                          (t) => (
                            <FormSelectItem key={t} value={t}>
                              {TYPE_LABELS[t]}
                            </FormSelectItem>
                          ),
                        )}
                      </FormSelectContent>
                    </FormSelect>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-3">
                <FormField
                  control={form.control}
                  name="monthlyValue"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>القيمة الشهرية (ر.س)</FormLabel>
                      <FormControl>
                        <FormInputControl
                          type="number"
                          min="0"
                          step="0.01"
                          {...field}
                          value={field.value ?? ""}
                          onChange={(e) => {
                            const n = e.target.valueAsNumber;
                            field.onChange(Number.isNaN(n) ? undefined : n);
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
                      <FormLabel>إجمالي القيمة (ر.س)</FormLabel>
                      <FormControl>
                        <FormInputControl
                          type="number"
                          min="0"
                          step="0.01"
                          {...field}
                          value={field.value ?? ""}
                          onChange={(e) => {
                            const n = e.target.valueAsNumber;
                            field.onChange(Number.isNaN(n) ? undefined : n);
                          }}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

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

              <div>
                <p className="text-sm font-medium mb-1.5">ملف العقد (PDF)</p>
                <div
                  role="button"
                  tabIndex={0}
                  className="flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed p-5 cursor-pointer hover:bg-neutral-50 transition-colors"
                  onClick={() => fileInputRef.current?.click()}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ")
                      fileInputRef.current?.click();
                  }}
                  onDrop={handleDrop}
                  onDragOver={(e) => e.preventDefault()}
                >
                  {file ? (
                    <>
                      <FileText className="w-8 h-8 text-action-blue" />
                      <p className="text-sm font-medium">{file.name}</p>
                      <p className="text-xs text-neutral-300">
                        {(file.size / 1024).toFixed(0)} KB
                      </p>
                    </>
                  ) : (
                    <>
                      <Upload className="w-7 h-7 text-neutral-300" />
                      <p className="text-sm text-neutral-300">
                        اسحب الملف هنا أو انقر للاختيار
                      </p>
                    </>
                  )}
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="application/pdf"
                  className="hidden"
                  onChange={handleFileChange}
                />
              </div>

              <div className="flex justify-end gap-2">
                <ActionButton
                  type="button"
                  variant="outline"
                  onClick={() => handleOpenChange(false)}
                  disabled={isLoading}
                >
                  إلغاء
                </ActionButton>
                <ActionButton
                  type="submit"
                  variant="primary"
                  loading={isLoading}
                  disabled={!file}
                >
                  {isLoading ? "جارٍ الإرسال..." : "إنشاء وإرسال"}
                </ActionButton>
              </div>
            </form>
          </Form>
        )}
      </Dialog>
    </>
  );
}
