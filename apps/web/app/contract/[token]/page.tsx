"use client";

import { useState, use, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import {
  useGetContractByTokenQuery,
  useSignContractByTokenMutation,
} from "@/features/contracts/contractsApi";
import { ActionButton } from "@/components/design-system/ActionButton";
import { SurfaceCard } from "@/components/design-system/SurfaceCard";
import { FormInputControl } from "@/components/design-system/FormInputControl";
import { Label } from "@/components/design-system/Primitives";
import { ContractPaymentSummary } from "@/components/shared/ContractPaymentSummary";
import { toast } from "sonner";
import {
  FileText,
  Download,
  CheckCircle,
  AlertCircle,
  PenLine,
} from "lucide-react";

import { buildPortalFileUrl } from "@/lib/portal-files";

interface PageProps {
  params: Promise<{ token: string }>;
}

const STATUS_LABELS: Record<string, string> = {
  DRAFT: "مسودة",
  SENT: "بانتظار توقيعك",
  SIGNED: "موقَّع",
  ACTIVE: "ساري",
  EXPIRED: "منتهي",
  CANCELLED: "ملغى",
};

const STATUS_COLORS: Record<string, string> = {
  DRAFT: "bg-neutral-100 text-neutral-700",
  SENT: "bg-action-blue-soft text-action-blue",
  SIGNED: "bg-success-100 text-success-700",
  ACTIVE: "bg-success-100 text-success-700",
  EXPIRED: "bg-alert-100 text-alert-700",
  CANCELLED: "bg-danger-100 text-danger-700",
};

export default function ContractSharePage({ params }: PageProps) {
  const { token } = use(params);
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
          <p className="text-neutral-300">جارٍ تحميل العقد...</p>
        </div>
      }
    >
      <ContractSharePageInner token={token} />
    </Suspense>
  );
}

function ContractSharePageInner({ token }: { token: string }) {
  const searchParams = useSearchParams();
  const { data, isLoading, isError, refetch } =
    useGetContractByTokenQuery(token);
  const [signContract, { isLoading: signing }] =
    useSignContractByTokenMutation();

  const [signedByName, setSignedByName] = useState("");
  const [signedByEmail, setSignedByEmail] = useState("");

  useEffect(() => {
    if (searchParams.get("stripe_success") === "true") {
      toast.success("تم دفع الفاتورة بنجاح! يمكنك الآن توقيع العقد.", {
        duration: 6000,
      });
      const cleanUrl = window.location.origin + window.location.pathname;
      window.history.replaceState({}, "", cleanUrl);
    }
  }, [searchParams]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
        <p className="text-neutral-300">جارٍ تحميل العقد...</p>
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
        <p className="text-danger-500">
          العقد غير متوفر أو انتهت صلاحية الرابط.
        </p>
      </div>
    );
  }

  const canSign = data.status === "SENT";
  const invoices = data.invoices ?? [];

  const allInvoicesPaid =
    invoices.length === 0 || invoices.every((inv) => inv.status === "PAID");
  const canSignNow =
    canSign && allInvoicesPaid && signedByName.trim() && signedByEmail.trim();
  const statusLabel = STATUS_LABELS[data.status] ?? data.status;
  const statusColor =
    STATUS_COLORS[data.status] ?? "bg-neutral-50 text-neutral-300";
  const fileUrl = data.filePath ? buildPortalFileUrl(data.filePath) : null;

  async function handleSign() {
    if (!signedByName.trim()) {
      toast.error("يرجى كتابة اسمك الكامل قبل التوقيع");
      return;
    }
    try {
      await signContract({
        token,
        body: {
          signedByName: signedByName.trim(),
          signedByEmail: signedByEmail.trim() || undefined,
        },
      }).unwrap();
      toast.success("تم توقيع العقد بنجاح — شكراً لك");
      refetch();
    } catch {
      toast.error("تعذّر توقيع العقد. حاول مجدداً.");
    }
  }

  return (
    <div className="min-h-screen bg-neutral-50 flex items-center justify-center p-6">
      <div className="w-full max-w-2xl" dir="rtl">
        <SurfaceCard className="w-full max-w-2xl">
          <div className="pb-4 px-5 pt-5">
            <div className="flex items-start justify-between flex-wrap gap-3">
              <div>
                <h2 className="text-xl font-semibold">{data.title}</h2>
                {data.client?.companyName && (
                  <p className="text-sm text-neutral-300 mt-1">
                    {data.client.companyName}
                    {data.client.user?.name
                      ? ` — ${data.client.user.name}`
                      : ""}
                  </p>
                )}
              </div>
              <span
                className={`px-3 py-1 rounded-full text-xs font-semibold shrink-0 ${statusColor}`}
              >
                {statusLabel}
              </span>
            </div>
          </div>

          <div className="space-y-5 px-5 pb-5">
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="rounded-lg bg-neutral-50 p-3">
                <p className="text-xs text-neutral-300 mb-0.5">
                  القيمة الإجمالية
                </p>
                <p className="font-semibold">
                  {data.totalValue.toLocaleString("ar-SA-u-nu-latn")} ر.س
                </p>
              </div>
              <div className="rounded-lg bg-neutral-50 p-3">
                <p className="text-xs text-neutral-300 mb-0.5">
                  القيمة الشهرية
                </p>
                <p className="font-semibold">
                  {data.monthlyValue?.toLocaleString("ar-SA-u-nu-latn") ?? "—"}{" "}
                  ر.س
                </p>
              </div>
              <div className="rounded-lg bg-neutral-50 p-3">
                <p className="text-xs text-neutral-300 mb-0.5">تاريخ البداية</p>
                <p className="font-semibold">
                  {new Date(data.startDate).toLocaleDateString(
                    "ar-SA-u-nu-latn",
                  )}
                </p>
              </div>
              <div className="rounded-lg bg-neutral-50 p-3">
                <p className="text-xs text-neutral-300 mb-0.5">تاريخ النهاية</p>
                <p className="font-semibold">
                  {new Date(data.endDate).toLocaleDateString("ar-SA-u-nu-latn")}
                </p>
              </div>
            </div>

            {/* ── Billing breakdown (down payment + monthly) ───── */}
            {data.downPaymentType && data.downPaymentValue != null && (
              <div className="rounded-xl border border-neutral-200 p-4 space-y-2.5">
                <p className="text-sm font-bold text-natural-100">خطة الدفع</p>
                <div className="text-sm space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-neutral-300">الدفعة الأولى</span>
                    <span className="font-semibold">
                      {data.downPaymentType === "PERCENT"
                        ? `${data.downPaymentValue}%`
                        : `${data.downPaymentValue.toLocaleString("ar-SA-u-nu-latn")} ر.س`}
                      {data.downPaymentType === "PERCENT" && (
                        <span className="text-neutral-300 font-normal mr-1">
                          (
                          {(
                            data.totalValue *
                            (data.downPaymentValue / 100)
                          ).toLocaleString("ar-SA-u-nu-latn")}{" "}
                          ر.س)
                        </span>
                      )}
                    </span>
                  </div>
                  {data.monthlyValue > 0 && (
                    <div className="flex items-center justify-between">
                      <span className="text-neutral-300">الدفعة الشهرية</span>
                      <span className="font-semibold">
                        {data.monthlyValue.toLocaleString("ar-SA-u-nu-latn")}{" "}
                        ر.س
                        {data.numberOfMonths ? (
                          <span className="text-neutral-300 font-normal mr-1">
                            × {data.numberOfMonths} أشهر
                          </span>
                        ) : null}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {fileUrl ? (
              <div className="flex items-center gap-3 rounded-xl border bg-neutral-50 p-4">
                <FileText className="w-8 h-8 text-action-blue shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium">ملف العقد</p>
                  <p className="text-xs text-neutral-300">
                    راجع العقد كاملاً قبل التوقيع
                  </p>
                </div>
                <a
                  href={fileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  download
                >
                  <ActionButton
                    variant="outline"
                    size="sm"
                    className="gap-2 shrink-0"
                  >
                    <Download className="w-4 h-4" />
                    تحميل العقد
                  </ActionButton>
                </a>
              </div>
            ) : (
              <div className="flex items-center gap-3 rounded-xl border bg-neutral-50 p-4">
                <AlertCircle className="w-5 h-5 text-neutral-300" />
                <p className="text-sm text-neutral-300">
                  لا يوجد ملف مرفق لهذا العقد.
                </p>
              </div>
            )}

            <ContractPaymentSummary
              services={data.servicesList ?? []}
              totalValue={data.totalValue}
              invoices={invoices}
              showPayButton={canSign}
              onPaymentComplete={() => window.location.reload()}
            />

            {data.status === "SIGNED" && (
              <div className="flex items-center gap-2 rounded-xl bg-success-100 border border-success-200 px-4 py-3">
                <CheckCircle className="w-5 h-5 text-success-600 shrink-0" />
                <div>
                  <p className="text-sm text-success-700 font-medium">
                    تم توقيع هذا العقد.
                  </p>
                  {data.signedAt && (
                    <p className="text-xs text-success-600 mt-0.5">
                      {new Date(data.signedAt).toLocaleString(
                        "ar-SA-u-nu-latn",
                      )}
                    </p>
                  )}
                </div>
              </div>
            )}

            {canSign && (
              <div className="space-y-4 rounded-xl border p-4">
                <div className="flex items-center gap-2">
                  <PenLine className="w-4 h-4 text-secondary-500" />
                  <p className="text-sm font-semibold">توقيع العقد</p>
                </div>

                {!allInvoicesPaid && (
                  <div className="flex items-center gap-2 rounded-lg bg-alert-100 border border-alert-200 px-3 py-2.5">
                    <AlertCircle className="w-4 h-4 text-alert-600 shrink-0" />
                    <p className="text-xs text-alert-700">
                      يجب دفع جميع الفواتير قبل توقيع العقد. اضغط على زر
                      &quot;ادفع&quot; بجانب كل فاتورة.
                    </p>
                  </div>
                )}

                <div className="space-y-3">
                  <div>
                    <Label htmlFor="signedByName" className="text-sm">
                      الاسم الكامل <span className="text-danger-500">*</span>
                    </Label>
                    <FormInputControl
                      id="signedByName"
                      placeholder="اكتب اسمك الكامل"
                      value={signedByName}
                      onChange={(e) => setSignedByName(e.target.value)}
                      className="mt-1"
                      disabled={!allInvoicesPaid}
                    />
                  </div>
                  <div>
                    <Label htmlFor="signedByEmail" className="text-sm">
                      البريد الإلكتروني{" "}
                      <span className="text-danger-500">*</span>
                    </Label>
                    <FormInputControl
                      id="signedByEmail"
                      type="email"
                      placeholder="your@email.com"
                      value={signedByEmail}
                      onChange={(e) => setSignedByEmail(e.target.value)}
                      className="mt-1"
                      disabled={!allInvoicesPaid}
                    />
                  </div>
                </div>

                <ActionButton
                  onClick={handleSign}
                  disabled={signing || !canSignNow}
                  className="w-full gap-2"
                >
                  <CheckCircle className="w-4 h-4" />
                  {!allInvoicesPaid
                    ? "يجب دفع الفواتير أولاً"
                    : signing
                      ? "جارٍ التوقيع..."
                      : "أوافق وأوقّع العقد"}
                </ActionButton>

                <p className="text-xs text-neutral-300 text-center">
                  بالتوقيع، تقر بأنك قرأت العقد وتوافق على جميع شروطه.
                </p>
              </div>
            )}
          </div>
        </SurfaceCard>
      </div>
    </div>
  );
}
