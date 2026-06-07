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
import { ActionButton } from "@/components/design-system/ActionButton";
import { FormInput } from "@/components/design-system/FormInput";
import { Skeleton } from "@/components/design-system/Skeleton";
import { ContractPaymentSummary } from "@/components/shared/ContractPaymentSummary";
import { SurfaceCard } from "@/components/design-system/SurfaceCard";
import { StatusBadge } from "@/components/design-system/StatusBadge";
import { StatusBanner } from "@/components/design-system/StatusBanner";
import { InfoPanel } from "@/components/design-system/InfoPanel";
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
  const { data, isLoading, isError } = useGetPortalContractByIdQuery(id, { pollingInterval: 30_000 });
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
          <ActionButton variant="ghost" size="sm" className="gap-2">
            <ArrowRight className="h-4 w-4" />
            العقود
          </ActionButton>
        </Link>
        <SurfaceCard title="تعذر تحميل العقد" icon={AlertCircle}>
          <p className="text-center text-sm text-portal-note-text">
            العقد غير متوفر.
          </p>
        </SurfaceCard>
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
          <ActionButton
            variant="ghost"
            size="sm"
            className="gap-1.5 text-portal-note-text hover:text-natural-100"
          >
            <ArrowRight className="h-4 w-4" />
            العقود
          </ActionButton>
        </Link>
        <span className="text-portal-note-text">/</span>
        <span className="max-w-xs truncate text-sm font-medium text-natural-100">
          {data.title}
        </span>
      </div>

      {/* Main contract card */}
      <SurfaceCard
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
            <InfoPanel variant="default" title="القيمة الإجمالية">
              <p className="font-semibold text-natural-100">
                {data.totalValue.toLocaleString("ar-SA-u-nu-latn")} ر.س
              </p>
            </InfoPanel>
            <InfoPanel variant="default" title="القيمة الشهرية">
              <p className="font-semibold text-natural-100">
                {data.monthlyValue.toLocaleString("ar-SA-u-nu-latn")} ر.س
              </p>
            </InfoPanel>
            <InfoPanel variant="default" title="تاريخ البداية">
              <p className="font-semibold text-natural-100">
                {new Date(data.startDate).toLocaleDateString("ar-SA-u-nu-latn")}
              </p>
            </InfoPanel>
            <InfoPanel variant="default" title="تاريخ النهاية">
              <p className="font-semibold text-natural-100">
                {new Date(data.endDate).toLocaleDateString("ar-SA-u-nu-latn")}
              </p>
            </InfoPanel>
          </div>

          {fileUrl ? (
            <InfoPanel variant="bordered" title="ملف العقد" description="راجع العقد كاملاً قبل التوقيع">
              <div className="flex items-center gap-3">
                <FileText className="h-8 w-8 shrink-0 text-action-blue" />
                <div className="min-w-0 flex-1">
                </div>
                <ActionButton href={fileUrl} variant="outline" icon={<Download className="h-4 w-4" />}>
                  تحميل العقد
                </ActionButton>
              </div>
            </InfoPanel>
          ) : (
            <InfoPanel variant="bordered" description="لا يوجد ملف مرفق لهذا العقد.">
            </InfoPanel>
          )}

          <ContractPaymentSummary
            services={data.servicesList ?? []}
            totalValue={data.totalValue}
            invoices={invoices}
            showPayButton={canSign}
            onPaymentComplete={() => window.location.reload()}
          />

          {data.status === "SIGNED" && (
            <StatusBanner variant="success" title="تم توقيع هذا العقد.">
              {data.signedAt
                ? new Date(data.signedAt).toLocaleString("ar-SA-u-nu-latn")
                : null}
            </StatusBanner>
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
                <StatusBanner variant="warning" title="يجب دفع جميع الفواتير قبل توقيع العقد. اضغط على زر &quot;ادفع&quot; بجانب كل فاتورة.">
                </StatusBanner>
              )}

              <div className="space-y-3">
                <FormInput
                  label="الاسم الكامل"
                  id="signedByName"
                  placeholder="اكتب اسمك الكامل"
                  value={signedByName}
                  onChange={(e) => setSignedByName(e.target.value)}
                  disabled={!allInvoicesPaid}
                />
                <FormInput
                  label="البريد الإلكتروني"
                  id="signedByEmail"
                  type="email"
                  placeholder="your@email.com"
                  value={signedByEmail}
                  onChange={(e) => setSignedByEmail(e.target.value)}
                  disabled={!allInvoicesPaid}
                />
              </div>
              <ActionButton
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
              </ActionButton>
              <p className="text-center text-xs text-portal-note-text">
                بالتوقيع، تقر بأنك قرأت العقد وتوافق على جميع شروطه.
              </p>
            </div>
          )}
        </div>
      </SurfaceCard>
    </div>
  );
}
