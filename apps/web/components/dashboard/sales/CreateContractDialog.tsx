"use client";

import { useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useGetRequestsQuery } from "@/features/requests/requestsApi";
import { useCreateContractMutation } from "@/features/contracts/contractsApi";
import { ContractType, RequestStatus } from "@hassad/shared";
import { FileText, Upload, Copy, CheckCheck } from "lucide-react";

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
  monthlyValue: z.number().nonnegative("القيمة الشهرية مطلوبة"),
  totalValue: z.number().positive("إجمالي القيمة مطلوب"),
  startDate: z.string().min(1, "تاريخ البداية مطلوب"),
  endDate: z.string().min(1, "تاريخ النهاية مطلوب"),
});

type ContractFormValues = z.infer<typeof contractFormSchema>;

const CONTRACT_READY_STATUSES = new Set<RequestStatus>([
  RequestStatus.CONTRACT_PREPARATION,
  RequestStatus.CONTRACT_SENT,
]);

// ── Component ─────────────────────────────────────────────────────────────────

export function CreateContractDialog() {
  const [open, setOpen] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [shareLink, setShareLink] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [createContract, { isLoading }] = useCreateContractMutation();

  const { data: requestsData, isFetching: requestsFetching } =
    useGetRequestsQuery({ limit: 100 }, { skip: !open });

  const contractRequests = (requestsData ?? []).filter((request) =>
    CONTRACT_READY_STATUSES.has(request.status),
  );

  const form = useForm<ContractFormValues>({
    resolver: zodResolver(contractFormSchema),
    defaultValues: {
      requestId: "",
      title: "",
      type: undefined,
      monthlyValue: 0,
      totalValue: 0,
      startDate: "",
      endDate: "",
    },
  });

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
      const result = await createContract({
        requestId: values.requestId,
        title: values.title,
        type: values.type,
        monthlyValue: values.monthlyValue,
        totalValue: values.totalValue,
        startDate: values.startDate,
        endDate: values.endDate,
        file,
      }).unwrap();

      // Build shareable link
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

  function handleClose(val: boolean) {
    if (!val) {
      setShareLink(null);
      setCopied(false);
      form.reset();
      setFile(null);
    }
    setOpen(val);
  }

  async function copyLink() {
    if (!shareLink) return;
    await navigator.clipboard.writeText(shareLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogTrigger asChild>
        <Button>إنشاء عقد</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg" dir="rtl">
        <DialogHeader>
          <DialogTitle>عقد جديد</DialogTitle>
        </DialogHeader>

        {/* ── Success: show share link ── */}
        {shareLink ? (
          <div className="space-y-5 py-2">
            {/* Success banner */}
            <div className="flex flex-col items-center gap-3 py-4 text-center">
              <div className="h-14 w-14 rounded-full bg-emerald-100 flex items-center justify-center">
                <CheckCheck className="h-7 w-7 text-emerald-600" />
              </div>
              <div>
                <p className="font-semibold text-base">
                  تم إنشاء العقد وإرساله
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  شارك رابط التوقيع مع العميل ليوقّع إلكترونياً
                </p>
              </div>
            </div>

            {/* Copy row — show link inside a full-width read-only input with internal copy button */}
            <div className="min-w-0">
              <div className="relative w-full">
                <Input
                  readOnly
                  value={shareLink ?? ""}
                  dir="ltr"
                  className="w-full pr-36 text-xs font-mono truncate"
                />
                <div className="absolute inset-y-0 right-2 flex items-center">
                  <Button
                    size="sm"
                    variant={copied ? "secondary" : "default"}
                    className="gap-2"
                    onClick={copyLink}
                  >
                    {copied ? (
                      <>
                        <CheckCheck className="w-3.5 h-3.5" />
                        تم النسخ
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        نسخ الرابط
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </div>

            <Button
              className="w-full"
              variant="outline"
              onClick={() => handleClose(false)}
            >
              إغلاق
            </Button>
          </div>
        ) : (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              {/* Request picker */}
              <FormField
                control={form.control}
                name="requestId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>الطلب (مرحلة إعداد العقد)</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue
                            placeholder={
                              requestsFetching
                                ? "جارٍ التحميل..."
                                : contractRequests.length === 0
                                  ? "لا توجد طلبات في مرحلة العقد"
                                  : "اختر الطلب"
                            }
                          />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {contractRequests.map((request) => (
                          <SelectItem key={request.id} value={request.id}>
                            {request.companyName}
                            {request.contactName
                              ? ` — ${request.contactName}`
                              : ""}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground">
                      يعرض هذا الحقل الطلبات الموجودة حالياً في مسار إعداد العقد
                      أو المرسلة للتوقيع
                    </p>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Title */}
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>عنوان العقد</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="عقد خدمات التسويق الرقمي..."
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Type */}
              <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>نوع العقد</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="اختر النوع" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {(Object.values(ContractType) as ContractType[]).map(
                          (t) => (
                            <SelectItem key={t} value={t}>
                              {TYPE_LABELS[t]}
                            </SelectItem>
                          ),
                        )}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Financial values */}
              <div className="grid grid-cols-2 gap-3">
                <FormField
                  control={form.control}
                  name="monthlyValue"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>القيمة الشهرية (ر.س)</FormLabel>
                      <FormControl>
                        <Input
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
                        <Input
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

              {/* Dates */}
              <div className="grid grid-cols-2 gap-3">
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

              {/* PDF Upload */}
              <div>
                <p className="text-sm font-medium mb-1.5">ملف العقد (PDF)</p>
                <div
                  role="button"
                  tabIndex={0}
                  className="flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed p-5 cursor-pointer hover:bg-muted/40 transition-colors"
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
                      <FileText className="w-8 h-8 text-blue-600" />
                      <p className="text-sm font-medium">{file.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {(file.size / 1024).toFixed(0)} KB
                      </p>
                    </>
                  ) : (
                    <>
                      <Upload className="w-7 h-7 text-muted-foreground" />
                      <p className="text-sm text-muted-foreground">
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
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => handleClose(false)}
                  disabled={isLoading}
                >
                  إلغاء
                </Button>
                <Button type="submit" disabled={isLoading || !file}>
                  {isLoading ? "جارٍ الإرسال..." : "إنشاء وإرسال"}
                </Button>
              </div>
            </form>
          </Form>
        )}
      </DialogContent>
    </Dialog>
  );
}
