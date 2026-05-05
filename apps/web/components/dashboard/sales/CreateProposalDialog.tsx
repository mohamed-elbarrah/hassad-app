"use client";

import { useState, useRef } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Paperclip, X, Copy, CheckCheck } from "lucide-react";
import { RequestStatus } from "@hassad/shared";
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
import { useCreateProposalMutation } from "@/features/proposals/proposalsApi";
import { useGetRequestsQuery } from "@/features/requests/requestsApi";
import { SearchCombobox } from "@/components/common/SearchCombobox";

// ── Schema ────────────────────────────────────────────────────────────────────

const proposalFormSchema = z.object({
  requestId: z.string().min(1, "اختر الطلب"),
  title: z.string().min(2, "أدخل عنوان العرض"),
  file: z
    .instanceof(File, { message: "يرجى رفع ملف PDF للعرض الفني" })
    .refine((f) => f.size > 0, "الملف فارغ")
    .refine(
      (f) => f.type === "application/pdf" || f.name.endsWith(".pdf"),
      "يجب أن يكون الملف بصيغة PDF",
    ),
});

type ProposalFormValues = z.infer<typeof proposalFormSchema>;

const REQUEST_STATUS_LABELS: Record<RequestStatus, string> = {
  [RequestStatus.SUBMITTED]: "طلب جديد",
  [RequestStatus.QUALIFYING]: "مراجعة المبيعات",
  [RequestStatus.PROPOSAL_IN_PROGRESS]: "إعداد العرض",
  [RequestStatus.PROPOSAL_SENT]: "تم إرسال العرض",
  [RequestStatus.NEGOTIATION]: "تفاوض",
  [RequestStatus.CONTRACT_PREPARATION]: "إعداد العقد",
  [RequestStatus.CONTRACT_SENT]: "العقد مرسل",
  [RequestStatus.SIGNED]: "تم التوقيع",
  [RequestStatus.PROJECT_CREATED]: "تحول إلى مشروع",
  [RequestStatus.CANCELLED]: "ملغي",
};

const PROPOSAL_READY_STATUSES = new Set<RequestStatus>([
  RequestStatus.QUALIFYING,
  RequestStatus.PROPOSAL_IN_PROGRESS,
  RequestStatus.PROPOSAL_SENT,
  RequestStatus.NEGOTIATION,
]);

// ── Component ─────────────────────────────────────────────────────────────────

export function CreateProposalDialog() {
  const [open, setOpen] = useState(false);
  const [requestSearch, setRequestSearch] = useState("");
  const [sentLink, setSentLink] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [createProposal, { isLoading }] = useCreateProposalMutation();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data: requestsData, isFetching: requestsFetching } =
    useGetRequestsQuery({ limit: 100 }, { skip: !open });

  const proposalRequests = (requestsData ?? []).filter((request) =>
    PROPOSAL_READY_STATUSES.has(request.status),
  );

  const filteredRequests = proposalRequests.filter(
    (request) =>
      !requestSearch ||
      request.companyName.toLowerCase().includes(requestSearch.toLowerCase()) ||
      request.contactName.toLowerCase().includes(requestSearch.toLowerCase()),
  );

  const requestOptions = filteredRequests.map((request) => ({
    id: request.id,
    label: `${request.companyName} — ${request.contactName} (${REQUEST_STATUS_LABELS[request.status]})`,
  }));

  const form = useForm<ProposalFormValues>({
    resolver: zodResolver(proposalFormSchema),
    defaultValues: {
      requestId: "",
      title: "",
    },
  });

  const watchedFile = form.watch("file");

  function handleOpenChange(nextOpen: boolean) {
    setOpen(nextOpen);
    if (!nextOpen) {
      form.reset();
      setSentLink(null);
      setCopied(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  async function onSubmit(values: ProposalFormValues) {
    try {
      const result = await createProposal({
        requestId: values.requestId,
        title: values.title,
        file: values.file,
      }).unwrap();

      if (result.shareLinkToken) {
        const link = `${window.location.origin}/proposal/${result.shareLinkToken}`;
        setSentLink(link);
      }
      toast.success("تم إنشاء العرض الفني وإرساله بنجاح");
    } catch (err: unknown) {
      const msg =
        (err as { data?: { message?: string } })?.data?.message ??
        "فشل إنشاء العرض الفني";
      console.error("createProposal error:", err);
      toast.error(msg);
    }
  }

  function copyLink() {
    if (!sentLink) return;
    navigator.clipboard.writeText(sentLink).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button>إنشاء عرض فني</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md" dir="rtl">
        <DialogHeader>
          <DialogTitle>عرض فني جديد</DialogTitle>
        </DialogHeader>

        {/* ── Success state: show shareable link ─────────────────────── */}
        {sentLink ? (
          <div className="space-y-5 py-2">
            {/* Success banner */}
            <div className="flex flex-col items-center gap-3 py-4 text-center">
              <div className="h-14 w-14 rounded-full bg-emerald-100 flex items-center justify-center">
                <CheckCheck className="h-7 w-7 text-emerald-600" />
              </div>
              <div>
                <p className="font-semibold text-base">
                  تم إنشاء العرض وإرساله
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  شارك الرابط مع العميل لمراجعة العرض والرد عليه
                </p>
              </div>
            </div>

            {/* Copy row — show link inside a full-width read-only input with internal copy button */}
            <div className="min-w-0">
              <div className="relative w-full">
                <Input
                  readOnly
                  value={sentLink}
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
              onClick={() => handleOpenChange(false)}
            >
              إغلاق
            </Button>
          </div>
        ) : (
          /* ── Form ─────────────────────────────────────────────────── */
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              {/* Request picker */}
              <FormField
                control={form.control}
                name="requestId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>الطلب</FormLabel>
                    <FormControl>
                      <SearchCombobox
                        value={field.value}
                        onChange={field.onChange}
                        options={requestOptions}
                        onSearchChange={setRequestSearch}
                        placeholder="ابحث عن طلب جاهز للعرض..."
                        searchPlaceholder="اكتب اسم الشركة أو العميل"
                        isLoading={requestsFetching}
                      />
                    </FormControl>
                    <p className="text-xs text-muted-foreground">
                      يعرض هذا الحقل الطلبات المؤهلة أو الموجودة بالفعل داخل
                      مسار العرض والتفاوض
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
                    <FormLabel>عنوان العرض</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="باقة إدارة وسائل التواصل الاجتماعي"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* PDF Upload */}
              <FormField
                control={form.control}
                name="file"
                render={({
                  field: { onChange, value: _value, ref, ...rest },
                }) => (
                  <FormItem>
                    <FormLabel>ملف العرض الفني (PDF)</FormLabel>
                    <FormControl>
                      <div className="space-y-2">
                        <div
                          className="flex items-center gap-3 rounded-lg border-2 border-dashed px-4 py-3 cursor-pointer hover:bg-muted/40 transition-colors"
                          onClick={() => fileInputRef.current?.click()}
                        >
                          <Paperclip className="w-4 h-4 text-muted-foreground shrink-0" />
                          <span className="text-sm text-muted-foreground flex-1 truncate">
                            {watchedFile
                              ? watchedFile.name
                              : "انقر لاختيار ملف PDF..."}
                          </span>
                          {watchedFile && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                onChange(undefined);
                                if (fileInputRef.current)
                                  fileInputRef.current.value = "";
                              }}
                              className="shrink-0 text-muted-foreground hover:text-destructive"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                        <input
                          ref={(el) => {
                            // Assign to local ref used by the click target
                            fileInputRef.current =
                              el as HTMLInputElement | null;
                            // Preserve RHF's ref (which may be a function or RefObject)
                            if (typeof ref === "function") ref(el);
                            else if (ref && typeof (ref as any) === "object")
                              (ref as any).current = el;
                          }}
                          type="file"
                          accept="application/pdf,.pdf"
                          className="hidden"
                          {...rest}
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) onChange(file);
                          }}
                        />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => handleOpenChange(false)}
                  disabled={isLoading}
                >
                  إلغاء
                </Button>
                <Button type="submit" disabled={isLoading}>
                  {isLoading ? "جارٍ الإرسال..." : "إرسال العرض الفني"}
                </Button>
              </div>
            </form>
          </Form>
        )}
      </DialogContent>
    </Dialog>
  );
}
