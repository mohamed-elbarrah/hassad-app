"use client";

import { use } from "react";
import Link from "next/link";
import {
  DollarSign,
  TrendingUp,
  PieChart,
  FileText,
  Download,
} from "lucide-react";
import { useGetContractByIdQuery } from "@/features/contracts/contractsApi";
import { ContractServicesTable } from "@/components/shared/ContractServicesTable";
import { ContractInvoicesList } from "@/components/shared/ContractInvoicesList";
import { FinanceStatusBadge } from "@/components/dashboard/finance/FinanceStatusBadge";
import { FinanceDetailBreadcrumb } from "@/components/dashboard/finance/shared/FinanceDetailBreadcrumb";
import { FinanceDetailSkeleton } from "@/components/dashboard/finance/shared/FinanceDetailSkeleton";
import { FinanceDetailError } from "@/components/dashboard/finance/shared/FinanceDetailError";
import { SurfaceCard } from "@/components/design-system/SurfaceCard";
import { ProgressBar } from "@/components/design-system/ProgressBar";
import { ActionButton } from "@/components/design-system/ActionButton";
import { DataTable } from "@/components/design-system/DataTable";
import { CurrencyDisplay } from "@/components/design-system/CurrencyDisplay";
import { buildPortalFileUrl } from "@/lib/portal-files";

interface PageProps {
  params: Promise<{ id: string }>;
}

const TYPE_LABELS: Record<string, string> = {
  MONTHLY_RETAINER: "اشتراك شهري",
  FIXED_PROJECT: "مشروع محدد",
  ONE_TIME_SERVICE: "خدمة مرة واحدة",
};

export default function FinanceContractDetailPage({ params }: PageProps) {
  const { id } = use(params);
  const { data, isLoading, isError } = useGetContractByIdQuery(id);

  if (isLoading) {
    return <FinanceDetailSkeleton />;
  }

  if (isError || !data) {
    return (
      <FinanceDetailError
        title="العقد غير موجود"
        backHref="/dashboard/finance/contracts"
        backLabel="العقود المالية"
      />
    );
  }

  const totalPaid =
    data.invoices?.reduce((acc, inv) => {
      const invPayments = inv.payments?.reduce((s, p) => s + p.amount, 0) ?? 0;
      return acc + invPayments;
    }, 0) ?? 0;

  const totalValue = data.totalValue;
  const remaining = totalValue - totalPaid;
  const collectionRate = totalValue > 0 ? (totalPaid / totalValue) * 100 : 0;
  const invoiceCount = data.invoices?.length ?? 0;
  const fileUrl = data.filePath ? buildPortalFileUrl(data.filePath) : null;

  return (
    <div className="space-y-5 animate-in fade-in duration-500">
      <FinanceDetailBreadcrumb
        items={[
          { label: "المالية", href: "/dashboard/finance" },
          { label: "العقود المالية", href: "/dashboard/finance/contracts" },
          { label: data.title },
        ]}
      />

      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold">{data.title}</h1>
          <div className="flex items-center gap-2 mt-1">
            <FinanceStatusBadge status={data.status} />
            <span className="text-xs text-portal-note-text">
              {TYPE_LABELS[data.type] ?? data.type}
            </span>
          </div>
        </div>
        <p className="text-sm text-portal-note-text">
          {data.client?.companyName}
          {data.client?.user?.name ? ` — ${data.client.user.name}` : ""}
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <div className="rounded-2xl border-[1.5px] border-portal-card-border bg-portal-bg p-4">
          <p className="text-sm text-portal-note-text mb-1">القيمة الإجمالية</p>
          <p className="text-xl font-bold text-natural-100"><CurrencyDisplay amount={totalValue} /></p>
          <p className="text-xs text-portal-note-text mt-1">{invoiceCount} فاتورة</p>
        </div>
        <div className="rounded-2xl border-[1.5px] border-portal-card-border bg-portal-bg p-4">
          <p className="text-sm text-portal-note-text mb-1">المحصل</p>
          <p className="text-xl font-bold text-success-600"><CurrencyDisplay amount={totalPaid} /></p>
          <div className="mt-2 space-y-1">
            <ProgressBar value={collectionRate} size="sm" />
            <p className="text-[10px] text-portal-note-text">{collectionRate.toFixed(1)}% من الإجمالي</p>
          </div>
        </div>
        <div className="rounded-2xl border-[1.5px] border-portal-card-border bg-portal-bg p-4">
          <p className="text-sm text-portal-note-text mb-1">المتبقي</p>
          <p className="text-xl font-bold text-danger-600"><CurrencyDisplay amount={remaining} /></p>
          <p className="text-xs text-portal-note-text mt-1">بعد خصم الدفعات</p>
        </div>
        <div className="rounded-2xl border-[1.5px] border-portal-card-border bg-portal-bg p-4">
          <p className="text-sm text-portal-note-text mb-1">نسبة التحصيل</p>
          <p className="text-xl font-bold text-natural-100">{collectionRate.toFixed(1)}%</p>
          <p className="text-xs text-portal-note-text mt-1">معدل الدفع</p>
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <ContractServicesTable
          services={data.servicesList ?? []}
          totalValue={totalValue}
        />
        <ContractInvoicesList invoices={data.invoices ?? []} />
      </div>

      {fileUrl && (
        <SurfaceCard className="border-none shadow-sm" contentClassName="pt-6">
          <div className="flex items-center gap-3 rounded-xl border border-portal-card-border bg-badge-gray-bg p-4">
            <FileText className="w-8 h-8 text-action-blue shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium">ملف العقد</p>
              <p className="text-xs text-portal-note-text">
                تحميل ملف العقد بصيغة PDF
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
                icon={<Download className="w-4 h-4" />}
              >
                تحميل العقد
              </ActionButton>
            </a>
          </div>
        </SurfaceCard>
      )}

      {data.invoices && data.invoices.length > 0 && (
        <SurfaceCard
          title="سجل الدفعات"
          description="جميع الدفعات المسجلة عبر فواتير هذا العقد"
          className="border-none shadow-md"
        >
          <DataTable
            columns={[
              { id: "invoice", label: "رقم الفاتورة" },
              { id: "date", label: "التاريخ" },
              { id: "amount", label: "المبلغ" },
              { id: "method", label: "طريقة الدفع" },
              { id: "status", label: "الحالة" },
            ]}
            data={data.invoices?.flatMap((inv) =>
              (inv.payments ?? []).map((payment) => ({
                ...payment,
                invoiceNumber: inv.invoiceNumber,
              })),
            ) || []}
            isLoading={isLoading}
            isError={false}
            emptyState={{
              icon: FileText,
              message: "لا توجد دفعات مسجلة بعد",
              hint: "ستظهر الدفعات هنا فور تسجيلها على الفواتير.",
            }}
            renderRow={(payment) => (
              <tr className="border-b-[1.5px] border-portal-divider">
                <td className="px-5 py-4 font-mono text-xs">{payment.invoiceNumber}</td>
                <td className="px-5 py-4">
                  {new Date(payment.date).toLocaleDateString("en-GB", {
                    day: "2-digit",
                    month: "short",
                    year: "numeric",
                  })}
                </td>
                <td className="px-5 py-4 font-medium text-success-600">
                  <CurrencyDisplay amount={payment.amount} />
                </td>
                <td className="px-5 py-4 text-portal-note-text text-xs">
                  BANK_TRANSFER
                </td>
                <td className="px-5 py-4">
                  <FinanceStatusBadge status={payment.status} />
                </td>
              </tr>
            )}
          />
        </SurfaceCard>
      )}
    </div>
  );
}
