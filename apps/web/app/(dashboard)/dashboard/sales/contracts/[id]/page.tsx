"use client";

import { use, useState } from "react";
import Link from "next/link";
import {
  FileText,
  Download,
  Copy,
  CheckCheck,
  Building2,
  User,
  Phone,
  Mail,
  ExternalLink,
  Receipt,
} from "lucide-react";
import { useGetContractByIdQuery } from "@/features/contracts/contractsApi";
import { ContractServicesTable } from "@/components/shared/ContractServicesTable";
import { SurfaceCard } from "@/components/design-system/SurfaceCard";
import { ActionButton } from "@/components/design-system/ActionButton";
import { DataTable } from "@/components/design-system/DataTable";
import { CurrencyDisplay } from "@/components/design-system/CurrencyDisplay";
import { InfoPanel } from "@/components/design-system/InfoPanel";
import { SalesStatusBadge } from "@/components/dashboard/sales/shared/SalesStatusBadge";
import { SalesDetailBreadcrumb } from "@/components/dashboard/sales/shared/SalesDetailBreadcrumb";
import { SalesDetailError } from "@/components/dashboard/sales/shared/SalesDetailError";
import { SalesDetailSkeleton } from "@/components/dashboard/sales/shared/SalesDetailSkeleton";
import { buildPortalFileUrl } from "@/lib/portal-files";
import { formatShortDate } from "@/lib/format";
import { toast } from "sonner";

interface PageProps {
  params: Promise<{ id: string }>;
}

const TYPE_LABELS: Record<string, string> = {
  MONTHLY_RETAINER: "اشتراك شهري",
  FIXED_PROJECT: "مشروع محدد",
  ONE_TIME_SERVICE: "خدمة مرة واحدة",
};

export default function SalesContractDetailPage({ params }: PageProps) {
  const { id } = use(params);
  const { data, isLoading, isError, refetch } = useGetContractByIdQuery(id);
  const [copied, setCopied] = useState(false);

  if (isLoading) return <SalesDetailSkeleton variant="contract" />;

  if (isError || !data) {
    return (
      <SalesDetailError
        title="العقد غير موجود"
        onRetry={refetch}
        backHref="/dashboard/sales/contracts"
        backLabel="العقود"
      />
    );
  }

  const fileUrl = data.filePath ? buildPortalFileUrl(data.filePath) : null;
  const invoices = data.invoices ?? [];
  const client = data.client;

  async function handleCopyLink() {
    if (!data.shareLinkToken) return;
    try {
      await navigator.clipboard.writeText(
        `${window.location.origin}/contract/${data.shareLinkToken}`,
      );
      setCopied(true);
      toast.success("تم نسخ رابط التوقيع");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("تعذر نسخ الرابط");
    }
  }

  return (
    <div className="flex flex-col gap-5" dir="rtl">
      <SalesDetailBreadcrumb
        backHref="/dashboard/sales/contracts"
        backLabel="العقود"
        title={data.title}
      />

      {/* ── Main card — everything inside ─────────────────────────────── */}
      <SurfaceCard
        title={data.title}
        icon={FileText}
        action={<SalesStatusBadge domain="contract" status={data.status} />}
      >
        <div className="space-y-6">
          {/* ── Client info ──────────────────────────────────────────── */}
          {client && (
            <div className="flex flex-col gap-3">
              <p className="text-xs font-medium text-portal-note-text">
                {TYPE_LABELS[data.type] ?? data.type}
              </p>
              <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm">
                <span className="flex items-center gap-1.5 text-natural-100">
                  <Building2 className="w-4 h-4 text-portal-note-text" />
                  {client.companyName ?? "—"}
                </span>
                {client.user?.name && (
                  <span className="flex items-center gap-1.5 text-natural-100">
                    <User className="w-4 h-4 text-portal-note-text" />
                    {client.user.name}
                  </span>
                )}
                {client.user?.phoneWhatsapp && (
                  <span
                    className="flex items-center gap-1.5 text-natural-100 font-mono"
                    dir="ltr"
                  >
                    <Phone className="w-4 h-4 text-portal-note-text" />
                    {client.user.phoneWhatsapp}
                  </span>
                )}
                {client.user?.email && (
                  <span
                    className="flex items-center gap-1.5 text-portal-note-text font-mono"
                    dir="ltr"
                  >
                    <Mail className="w-4 h-4" />
                    {client.user.email}
                  </span>
                )}
                <Link
                  href={`/dashboard/sales/clients/${client.id}`}
                  className="flex items-center gap-1 text-secondary-500 hover:underline"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  ملف العميل
                </Link>
              </div>
            </div>
          )}

          {/* ── Quick actions ────────────────────────────────────────── */}
          {data.shareLinkToken && (
            <div className="flex items-center gap-2">
              <ActionButton
                size="sm"
                variant={copied ? "primary" : "outline"}
                onClick={handleCopyLink}
                icon={
                  copied ? (
                    <CheckCheck className="w-4 h-4" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )
                }
              >
                {copied ? "تم النسخ" : "نسخ رابط التوقيع"}
              </ActionButton>
            </div>
          )}

          {/* ── Financial metrics ────────────────────────────────────── */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <InfoPanel variant="default" title="القيمة الإجمالية">
              <p className="text-lg font-bold text-natural-100">
                <CurrencyDisplay amount={data.totalValue} />
              </p>
            </InfoPanel>
            <InfoPanel variant="default" title="الدفعة الشهرية">
              <p className="text-lg font-bold text-natural-100">
                {data.monthlyValue > 0
                  ? `${data.monthlyValue.toLocaleString("ar-SA-u-nu-latn")} ر.س`
                  : "—"}
              </p>
            </InfoPanel>
            <InfoPanel variant="default" title="تاريخ البداية">
              <p className="text-base font-semibold text-natural-100">
                {formatShortDate(data.startDate)}
              </p>
            </InfoPanel>
            <InfoPanel variant="default" title="تاريخ النهاية">
              <p className="text-base font-semibold text-natural-100">
                {formatShortDate(data.endDate)}
              </p>
            </InfoPanel>
          </div>

          {/* ── Payment plan ────────────────────────────────────────── */}
          {data.downPaymentType && data.downPaymentValue != null && (
            <InfoPanel
              variant="bordered"
              title="خطة الدفع"
              description="الدفعة الأولى والأقساط الشهرية"
            >
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <p className="text-xs text-portal-note-text">الدفعة الأولى</p>
                  <p className="text-sm font-bold text-natural-100 mt-0.5">
                    {data.downPaymentType === "PERCENT"
                      ? `${data.downPaymentValue}%`
                      : `${data.downPaymentValue.toLocaleString("ar-SA-u-nu-latn")} ر.س`}
                    {data.downPaymentType === "PERCENT" && (
                      <span className="text-xs text-portal-note-text font-normal mr-1">
                        (
                        {(
                          data.totalValue *
                          (data.downPaymentValue / 100)
                        ).toLocaleString("ar-SA-u-nu-latn")}{" "}
                        ر.س)
                      </span>
                    )}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-portal-note-text">
                    الدفعة الشهرية
                  </p>
                  <p className="text-sm font-bold text-natural-100 mt-0.5">
                    {data.monthlyValue > 0
                      ? `${data.monthlyValue.toLocaleString("ar-SA-u-nu-latn")} ر.س`
                      : "—"}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-portal-note-text">عدد الأشهر</p>
                  <p className="text-sm font-bold text-natural-100 mt-0.5">
                    {data.numberOfMonths ?? "—"}
                  </p>
                </div>
              </div>
            </InfoPanel>
          )}

          {/* ── Services ─────────────────────────────────────────────── */}
          <ContractServicesTable
            services={data.servicesList ?? []}
            totalValue={data.totalValue}
          />

          {/* ── Invoices ────────────────────────────────────────────── */}
          <div>
            <p className="text-base font-medium text-natural-100 mb-3">
              الفواتير
            </p>
            <DataTable
              columns={[
                { id: "invoiceNumber", label: "رقم الفاتورة" },
                { id: "amount", label: "المبلغ" },
                { id: "status", label: "الحالة" },
                { id: "dueDate", label: "تاريخ الاستحقاق" },
                { id: "action", label: "", align: "left", width: "60px" },
              ]}
              data={invoices}
              isLoading={false}
              isError={false}
              skeletonRows={3}
              emptyState={{
                icon: Receipt,
                message: "لا توجد فواتير بعد",
                hint: "سيتم إنشاء الفواتير تلقائياً حسب خطة الدفع.",
              }}
              renderCells={(inv) => [
                <td key="num" className="px-5 py-3.5 align-middle">
                  <span
                    className="text-sm font-mono text-natural-100"
                    dir="ltr"
                  >
                    {inv.invoiceNumber}
                  </span>
                </td>,
                <td key="amount" className="px-5 py-3.5 align-middle">
                  <CurrencyDisplay
                    amount={inv.amount}
                    size="sm"
                    className="text-sm font-semibold text-natural-100"
                  />
                </td>,
                <td key="status" className="px-5 py-3.5 align-middle">
                  <SalesStatusBadge domain="invoice" status={inv.status} />
                </td>,
                <td key="due" className="px-5 py-3.5 align-middle">
                  <span className="text-sm text-portal-note-text">
                    {formatShortDate(inv.dueDate)}
                  </span>
                </td>,
                <td
                  key="action"
                  className="px-5 py-3.5 align-middle text-start"
                >
                  <Link
                    href={`/dashboard/finance/invoices/${inv.id}`}
                    onClick={(e) => e.stopPropagation()}
                  >
                    <ActionButton size="sm" variant="ghost">
                      <Receipt className="w-4 h-4" />
                    </ActionButton>
                  </Link>
                </td>,
              ]}
            />
          </div>

          {/* ── Contract file ─────────────────────────────────────────── */}
          {fileUrl && (
            <InfoPanel variant="bordered" title="ملف العقد">
              <div className="flex items-center gap-3">
                <FileText className="h-8 w-8 shrink-0 text-action-blue" />
                <div className="min-w-0 flex-1">
                  <p className="text-sm text-natural-100">العقد بصيغة PDF</p>
                </div>
                <a
                  href={fileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  download
                >
                  <ActionButton
                    variant="outline"
                    icon={<Download className="h-4 w-4" />}
                  >
                    تحميل
                  </ActionButton>
                </a>
              </div>
            </InfoPanel>
          )}

          {/* ── Linked proposal ──────────────────────────────────────── */}
          {data.proposal && (
            <InfoPanel
              variant="bordered"
              title="العرض الفني الأصلي"
              description="العرض المعتمد الذي تم بناء هذا العقد عليه"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-natural-100">
                    {data.proposal.title}
                  </p>
                  <p className="text-xs text-portal-note-text mt-0.5">
                    <CurrencyDisplay amount={data.proposal.totalPrice ?? 0} />
                  </p>
                </div>
                <Link href="/dashboard/sales/proposals">
                  <ActionButton variant="outline" size="sm">
                    عرض العروض
                  </ActionButton>
                </Link>
              </div>
            </InfoPanel>
          )}
        </div>
      </SurfaceCard>
    </div>
  );
}
