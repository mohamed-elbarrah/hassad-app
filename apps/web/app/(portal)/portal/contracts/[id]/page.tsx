"use client";

import { useState, use, useEffect, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  ArrowRight,
  FileText,
  Download,
  CheckCircle,
  AlertCircle,
  PenLine,
} from "lucide-react";
import { useSignContractByTokenMutation } from "@/features/contracts/contractsApi";
import { useGetPortalContractByIdQuery } from "@/features/portal/portalApi";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { ContractPaymentSummary } from "@/components/shared/ContractPaymentSummary";
import { PortalSurfaceCard } from "@/components/portal/PortalSurfaceCard";
import { StatusBadge } from "@/components/portal/StatusBadge";
import { toast } from "sonner";

import { buildPortalFileUrl } from "@/lib/portal-files";
import { mapContractStatusToUI } from "@/lib/utils/statusMapping";

interface PageProps {
  params: Promise<{ id: string }>;
}

const TYPE_LABELS: Record<string, string> = {
  MONTHLY_RETAINER: "شهري ثابت",
  FIXED_PROJECT: "مشروع محدد",
  ONE_TIME_SERVICE: "خدمة مرة واحدة",
};

export default function PortalContractDetailPage({ params }: PageProps) {
  const { id } = use(params);
  return (
    <Suspense
      fallback={
        <div className="flex flex-col gap-4" dir="rtl">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-80 w-full" />
        </div>
      }
    >
      <PortalContractDetailInner id={id} />
    </Suspense>
  );
}

function PortalContractDetailInner({ id }: { id: string }) {
  const searchParams = useSearchParams();
  const { data, isLoading, isError } = useGetPortalContractByIdQuery(id);
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
      <div className="flex flex-col gap-4" dir="rtl">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-80 w-full" />
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="flex flex-col gap-4" dir="rtl">
        <Link href="/portal/contracts">
          <Button variant="ghost" size="sm" className="gap-2">
            <ArrowRight className="h-4 w-4" />
            العقود
          </Button>
        </Link>
        <PortalSurfaceCard title="تعذر تحميل العقد" icon={AlertCircle}>
          <p className="text-center text-sm text-portal-note-text">
            العقد غير متوفر.
          </p>
        </PortalSurfaceCard>
      </div>
    );
  }

  const canSign = data.status === "SENT" && !!data.shareLinkToken;
  const invoices = data.invoices ?? [];

  const allInvoicesPaid =
    invoices.length > 0 && invoices.every((inv) => inv.status === "PAID");
  const canSignNow =
    canSign && allInvoicesPaid && signedByName.trim() && signedByEmail.trim();
  const fileUrl = data.filePath ? buildPortalFileUrl(data.filePath) : null;

  async function handleSign() {
    if (!signedByName.trim()) {
      toast.error("يرجى كتابة اسمك الكامل قبل التوقيع");
      return;
    }
    try {
      await signContract({
        token: data.shareLinkToken,
        body: {
          signedByName: signedByName.trim(),
          signedByEmail: signedByEmail.trim() || undefined,
        },
      }).unwrap();
      toast.success("تم توقيع العقد بنجاح — شكراً لك");
    } catch {
      toast.error("تعذّر توقيع العقد. حاول مجدداً.");
    }
  }

  return (
    <div className="flex flex-col gap-6" dir="rtl">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2">
        <Link href="/portal/contracts">
          <Button
            variant="ghost"
            size="sm"
            className="gap-1.5 text-portal-note-text hover:text-natural-100"
          >
            <ArrowRight className="h-4 w-4" />
            العقود
          </Button>
        </Link>
        <span className="text-portal-note-text">/</span>
        <span className="max-w-xs truncate text-sm font-medium text-natural-100">
          {data.title}
        </span>
      </div>

      {/* Main contract card */}
      <PortalSurfaceCard
        title={data.title}
        icon={FileText}
        action={<StatusBadge status={mapContractStatusToUI(data.status)} />}
      >
        <div className="space-y-5">
          {data.client?.companyName && (
            <p className="text-sm text-portal-note-text">
              {data.client.companyName}
              {data.client.contactName ? ` — ${data.client.contactName}` : ""}
            </p>
          )}
          {data.type && (
            <p className="text-xs text-portal-note-text">
              {TYPE_LABELS[data.type] ?? data.type}
            </p>
          )}

          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="rounded-2xl bg-portal-bg p-3">
              <p className="mb-0.5 text-xs text-portal-note-text">
                القيمة الإجمالية
              </p>
              <p className="font-semibold text-natural-100">
                {data.totalValue.toLocaleString("ar-SA-u-nu-latn")} ر.س
              </p>
            </div>
            <div className="rounded-2xl bg-portal-bg p-3">
              <p className="mb-0.5 text-xs text-portal-note-text">
                القيمة الشهرية
              </p>
              <p className="font-semibold text-natural-100">
                {data.monthlyValue.toLocaleString("ar-SA-u-nu-latn")} ر.س
              </p>
            </div>
            <div className="rounded-2xl bg-portal-bg p-3">
              <p className="mb-0.5 text-xs text-portal-note-text">
                تاريخ البداية
              </p>
              <p className="font-semibold text-natural-100">
                {new Date(data.startDate).toLocaleDateString("ar-SA-u-nu-latn")}
              </p>
            </div>
            <div className="rounded-2xl bg-portal-bg p-3">
              <p className="mb-0.5 text-xs text-portal-note-text">
                تاريخ النهاية
              </p>
              <p className="font-semibold text-natural-100">
                {new Date(data.endDate).toLocaleDateString("ar-SA-u-nu-latn")}
              </p>
            </div>
          </div>

          {fileUrl ? (
            <div className="flex items-center gap-3 rounded-2xl border border-portal-card-border bg-portal-bg p-4">
              <FileText className="h-8 w-8 shrink-0 text-action-blue" />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-natural-100">
                  ملف العقد
                </p>
                <p className="text-xs text-portal-note-text">
                  راجع العقد كاملاً قبل التوقيع
                </p>
              </div>
              <a
                href={fileUrl}
                target="_blank"
                rel="noopener noreferrer"
                download
              >
                <Button
                  variant="ghost"
                  className="h-9 rounded-xl border-[1.5px] border-portal-card-border bg-natural-0 px-3 text-xs font-medium text-portal-icon hover:bg-badge-gray-bg shrink-0 gap-2"
                >
                  <Download className="h-4 w-4" />
                  تحميل العقد
                </Button>
              </a>
            </div>
          ) : (
            <div className="flex items-center gap-3 rounded-2xl border border-portal-card-border bg-portal-bg p-4">
              <AlertCircle className="h-5 w-5 text-portal-note-text" />
              <p className="text-sm text-portal-note-text">
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
            <div className="flex items-center gap-2 rounded-2xl border border-badge-green-bg bg-badge-green-bg/50 px-4 py-3">
              <CheckCircle className="h-5 w-5 shrink-0 text-badge-green-text" />
              <div>
                <p className="text-sm font-medium text-badge-green-text">
                  تم توقيع هذا العقد.
                </p>
                {data.signedAt && (
                  <p className="mt-0.5 text-xs text-badge-green-text/80">
                    {new Date(data.signedAt).toLocaleString("ar-SA-u-nu-latn")}
                  </p>
                )}
              </div>
            </div>
          )}

          {canSign && (
            <div className="space-y-4 rounded-2xl border border-portal-card-border p-4">
              <div className="flex items-center gap-2">
                <PenLine className="h-4 w-4 text-secondary-500" />
                <p className="text-sm font-semibold text-natural-100">
                  توقيع العقد
                </p>
              </div>

              {!allInvoicesPaid && (
                <div className="flex items-center gap-2 rounded-2xl border border-badge-orange-bg bg-badge-orange-bg/50 px-3 py-2.5">
                  <AlertCircle className="h-4 w-4 shrink-0 text-badge-orange-text" />
                  <p className="text-xs text-badge-orange-text">
                    يجب دفع جميع الفواتير قبل توقيع العقد. اضغط على زر
                    &quot;ادفع&quot; بجانب كل فاتورة.
                  </p>
                </div>
              )}

              <div className="space-y-3">
                <div>
                  <Label
                    htmlFor="signedByName"
                    className="text-sm text-natural-100"
                  >
                    الاسم الكامل <span className="text-danger-500">*</span>
                  </Label>
                  <Input
                    id="signedByName"
                    placeholder="اكتب اسمك الكامل"
                    value={signedByName}
                    onChange={(e) => setSignedByName(e.target.value)}
                    className="mt-1"
                    disabled={!allInvoicesPaid}
                  />
                </div>
                <div>
                  <Label
                    htmlFor="signedByEmail"
                    className="text-sm text-natural-100"
                  >
                    البريد الإلكتروني <span className="text-danger-500">*</span>
                  </Label>
                  <Input
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
              <Button
                onClick={handleSign}
                disabled={signing || !canSignNow}
                className="h-12 rounded-2xl px-5 text-base font-medium w-full gap-2 bg-secondary-500 hover:bg-secondary-600"
              >
                <CheckCircle className="h-4 w-4" />
                {!allInvoicesPaid
                  ? "يجب دفع الفواتير أولاً"
                  : signing
                    ? "جارٍ التوقيع..."
                    : "أوافق وأوقّع العقد"}
              </Button>
              <p className="text-center text-xs text-portal-note-text">
                بالتوقيع، تقر بأنك قرأت العقد وتوافق على جميع شروطه.
              </p>
            </div>
          )}
        </div>
      </PortalSurfaceCard>
    </div>
  );
}
