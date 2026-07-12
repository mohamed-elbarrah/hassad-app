"use client";

import { useMemo } from "react";
import {
  DollarSign,
  FileText,
  Clock,
  AlertTriangle,
  CreditCard,
} from "lucide-react";
import { PageIntro } from "@/components/design-system/PageIntro";
import { SurfaceCard } from "@/components/design-system/SurfaceCard";
import {
  DataTable,
  type DataTableColumn,
  type DataTableEmptyState,
} from "@/components/design-system/DataTable";
import { AdminEmptyState } from "@/components/dashboard/admin/shared/AdminEmptyState";
import { cn } from "@/lib/utils";
import { useGetAdminFinanceOverviewQuery } from "@/features/admin/adminFinanceApi";

const fmtCurrency = (n: number) =>
  new Intl.NumberFormat("ar-SA", {
    style: "currency",
    currency: "SAR",
    minimumFractionDigits: 0,
  }).format(n);

const OVERDUE_COLUMNS: DataTableColumn[] = [
  { id: "invoiceNumber", label: "رقم الفاتورة", align: "right" },
  { id: "clientName", label: "العميل", align: "right" },
  { id: "amount", label: "المبلغ", align: "right" },
  { id: "dueDate", label: "تاريخ الاستحقاق", align: "right" },
  { id: "daysOverdue", label: "أيام التأخير", align: "right" },
];

const OVERDUE_EMPTY_STATE: DataTableEmptyState = {
  icon: AlertTriangle,
  message: "لا توجد فواتير متأخرة",
  hint: "جميع الفواتير مدفوعة في الوقت المحدد.",
};

const METHOD_COLUMNS: DataTableColumn[] = [
  { id: "method", label: "طريقة الدفع", align: "right" },
  { id: "count", label: "عدد المعاملات", align: "right" },
  { id: "amount", label: "المبلغ", align: "right" },
];

const METHOD_EMPTY_STATE: DataTableEmptyState = {
  icon: CreditCard,
  message: "لا توجد طرق دفع مسجلة",
  hint: "لم يتم تسجيل أي معاملات دفع بعد.",
};

export default function AdminFinancePage() {
  const { data, isLoading, isError } = useGetAdminFinanceOverviewQuery();

  const summaryCards = useMemo(() => {
    const s = data?.summary;
    return [
      {
        label: "إجمالي الإيرادات",
        value: s ? fmtCurrency(s.totalRevenue) : null,
        icon: DollarSign,
        className: "",
      },
      {
        label: "إجمالي الفوترة",
        value: s ? fmtCurrency(s.totalInvoiced) : null,
        icon: FileText,
        className: "",
      },
      {
        label: "المعلق",
        value: s ? fmtCurrency(s.totalPending) : null,
        icon: Clock,
        className: "bg-warning-100/50 border-warning-200 text-warning-600",
      },
      {
        label: "المتأخر",
        value: s ? fmtCurrency(s.totalOverdue) : null,
        icon: AlertTriangle,
        className: "bg-danger-100/50 border-danger-200 text-danger-600",
      },
    ];
  }, [data]);

  if (isError) {
    return (
      <div className="flex flex-col gap-5" dir="rtl">
        <AdminEmptyState
          icon={DollarSign}
          title="حدث خطأ أثناء تحميل البيانات المالية"
          description="يرجى تحديث الصفحة والمحاولة مرة أخرى."
        />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5" dir="rtl">
      <PageIntro
        title="المالية"
        description="نظرة عامة على الإيرادات والفواتير والمدفوعات"
        icon={DollarSign}
      />

      <div className="grid grid-cols-4 gap-4">
        {summaryCards.map((card) => (
          <div
            key={card.label}
            className={cn(
              "rounded-[30px] border-[1.5px] border-portal-card-border p-5",
              card.className,
            )}
          >
            <div className="flex items-center gap-2 mb-2">
              <card.icon className="h-4 w-4 text-portal-note-text" />
              <p className="text-sm text-portal-note-text">{card.label}</p>
            </div>
            <p className="text-2xl font-semibold text-natural-100">
              {isLoading ? "—" : card.value ?? "—"}
            </p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <SurfaceCard title="المدفوع مقابل غير المدفوع">
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2].map((i) => (
                <div
                  key={i}
                  className="h-16 animate-pulse rounded-xl bg-portal-card-border"
                />
              ))}
            </div>
          ) : (
            <div className="space-y-4">
              {[
                {
                  label: "المدفوع",
                  count: data?.paidVsUnpaid.paid.count ?? 0,
                  amount: data?.paidVsUnpaid.paid.amount ?? 0,
                  className: "bg-success-100/50 border-success-200",
                },
                {
                  label: "غير المدفوع",
                  count: data?.paidVsUnpaid.unpaid.count ?? 0,
                  amount: data?.paidVsUnpaid.unpaid.amount ?? 0,
                  className: "bg-danger-100/50 border-danger-200",
                },
              ].map((item) => (
                <div
                  key={item.label}
                  className={cn(
                    "flex items-center justify-between rounded-xl border p-4",
                    item.className,
                  )}
                >
                  <div>
                    <p className="text-sm font-medium">{item.label}</p>
                    <p className="text-xs text-portal-note-text">
                      {item.count} فاتورة
                    </p>
                  </div>
                  <p className="text-lg font-semibold">
                    {fmtCurrency(item.amount)}
                  </p>
                </div>
              ))}
            </div>
          )}
        </SurfaceCard>

        <SurfaceCard title="طرق الدفع">
          <DataTable
            columns={METHOD_COLUMNS}
            data={data?.paymentMethodSplit ?? []}
            isLoading={isLoading}
            isError={false}
            emptyState={METHOD_EMPTY_STATE}
            renderRow={(item) => (
              <tr
                key={item.method}
                className="border-b border-portal-divider last:border-0"
              >
                <td className="py-3 px-2 text-right text-sm font-medium text-natural-100">
                  {item.method}
                </td>
                <td className="py-3 px-2 text-right text-sm text-portal-note-text">
                  {item.count}
                </td>
                <td className="py-3 px-2 text-right text-sm text-portal-note-text">
                  {fmtCurrency(item.amount)}
                </td>
              </tr>
            )}
          />
        </SurfaceCard>
      </div>

      <SurfaceCard title="أكثر الفواتير تأخراً">
        <DataTable
          columns={OVERDUE_COLUMNS}
          data={data?.topOverdueInvoices ?? []}
          isLoading={isLoading}
          isError={false}
          emptyState={OVERDUE_EMPTY_STATE}
          renderRow={(inv) => (
            <tr
              key={inv.id}
              className="border-b border-portal-divider last:border-0"
            >
              <td className="py-3 px-2 text-right text-sm font-medium text-natural-100">
                {inv.invoiceNumber}
              </td>
              <td className="py-3 px-2 text-right text-sm text-portal-note-text">
                {inv.clientName}
              </td>
              <td className="py-3 px-2 text-right text-sm text-portal-note-text">
                {fmtCurrency(inv.amount)}
              </td>
              <td className="py-3 px-2 text-right text-sm text-portal-note-text">
                {new Date(inv.dueDate).toLocaleDateString("ar-SA")}
              </td>
              <td className="py-3 px-2 text-right">
                <span className="text-danger-500 text-sm font-medium">
                  {inv.daysOverdue} يوم
                </span>
              </td>
            </tr>
          )}
        />
      </SurfaceCard>
    </div>
  );
}
