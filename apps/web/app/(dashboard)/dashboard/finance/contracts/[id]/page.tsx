"use client";

import { use } from "react";
import Link from "next/link";
import {
  ArrowRight,
  Loader2,
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
    return (
      <div className="h-[60vh] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-secondary-500" />
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="flex flex-col gap-4" dir="rtl">
        <Link href="/dashboard/finance/contracts">
          <ActionButton variant="ghost" size="sm" className="gap-2">
            <ArrowRight className="h-4 w-4" />
            العقود المالية
          </ActionButton>
        </Link>
        <SurfaceCard className="shadow-sm">
          <div className="pt-6 text-center text-danger-500 text-sm">
            العقد غير موجود.
          </div>
        </SurfaceCard>
      </div>
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
    <div className="space-y-6 animate-in fade-in duration-500" dir="rtl">
      <div className="flex items-center gap-2">
        <Link href="/dashboard/finance/contracts">
          <ActionButton
            variant="ghost"
            size="sm"
            className="gap-1.5 text-neutral-300 hover:text-natural-100"
          >
            <ArrowRight className="h-4 w-4" />
            العقود المالية
          </ActionButton>
        </Link>
        <span className="text-neutral-300">/</span>
        <span className="text-sm font-medium truncate max-w-xs">
          {data.title}
        </span>
      </div>

      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{data.title}</h1>
          <div className="flex items-center gap-2 mt-1">
            <FinanceStatusBadge status={data.status} />
            <span className="text-xs text-neutral-300">
              {TYPE_LABELS[data.type] ?? data.type}
            </span>
          </div>
        </div>
        <p className="text-sm text-neutral-300">
          {data.client?.companyName}
          {data.client?.user?.name ? ` — ${data.client.user.name}` : ""}
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-4">
        <SurfaceCard className="border-none shadow-sm" contentClassName="pt-0">
          <div>
            <p className="text-portal-note-text text-sm">القيمة الإجمالية</p>
            <h3 className="text-2xl font-bold mt-1">
              <CurrencyDisplay amount={totalValue} />
            </h3>
          </div>
          <div className="flex items-center text-xs text-neutral-300 mt-3">
            <DollarSign className="w-3 h-3 ml-1" />
            <span>{invoiceCount} فاتورة</span>
          </div>
        </SurfaceCard>

        <SurfaceCard className="border-none shadow-sm" contentClassName="pt-0">
          <div>
            <p className="text-portal-note-text text-sm">المحصل</p>
            <h3 className="text-2xl font-bold text-success-600 mt-1">
              <CurrencyDisplay amount={totalPaid} />
            </h3>
          </div>
          <div className="mt-3 space-y-1">
            <ProgressBar value={collectionRate} size="sm" />
            <p className="text-[10px] text-neutral-300">
              {collectionRate.toFixed(1)}% من الإجمالي
            </p>
          </div>
        </SurfaceCard>

        <SurfaceCard className="border-none shadow-sm" contentClassName="pt-0">
          <div>
            <p className="text-portal-note-text text-sm">المتبقي</p>
            <h3 className="text-2xl font-bold text-danger-600 mt-1">
              <CurrencyDisplay amount={remaining} />
            </h3>
          </div>
          <div className="flex items-center text-xs text-neutral-300 mt-3">
            <TrendingUp className="w-3 h-3 ml-1" />
            <span>بعد خصم الدفعات</span>
          </div>
        </SurfaceCard>

        <SurfaceCard className="border-none shadow-sm" contentClassName="pt-0">
          <div>
            <p className="text-portal-note-text text-sm">نسبة التحصيل</p>
            <h3 className="text-2xl font-bold mt-1">
              {collectionRate.toFixed(1)}%
            </h3>
          </div>
          <div className="flex items-center text-xs text-neutral-300 mt-3">
            <PieChart className="w-3 h-3 ml-1 text-action-blue" />
            <span>معدل الدفع</span>
          </div>
        </SurfaceCard>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <ContractServicesTable
          services={data.servicesList ?? []}
          totalValue={totalValue}
        />
        <ContractInvoicesList invoices={data.invoices ?? []} />
      </div>

      {fileUrl && (
        <SurfaceCard className="border-none shadow-sm" contentClassName="pt-6">
          <div className="flex items-center gap-3 rounded-xl border bg-neutral-50/30 p-4">
            <FileText className="w-8 h-8 text-action-blue shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium">ملف العقد</p>
              <p className="text-xs text-neutral-300">
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
                <td className="px-5 py-4 text-neutral-400 text-xs">
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
