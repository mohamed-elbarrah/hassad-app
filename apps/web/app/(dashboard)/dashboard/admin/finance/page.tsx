"use client";

import { useMemo } from "react";
import {
  DollarSign,
  FileText,
  Clock,
  AlertTriangle,
  CreditCard,
  TrendingUp,
  Users,
  PiggyBank,
  AlertCircle,
  ArrowUpRight,
  ArrowDownRight,
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

const fmtPercent = (n: number) =>
  new Intl.NumberFormat("ar-SA", {
    style: "percent",
    minimumFractionDigits: 1,
  }).format(n / 100);

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

const INVOICE_COLUMNS: DataTableColumn[] = [
  { label: "رقم الفاتورة", id: "invoiceNumber", align: "right" },
  { label: "العميل", id: "clientName", align: "right" },
  { label: "المبلغ", id: "amount", align: "right" },
  { label: "الحالة", id: "status", align: "right" },
  { label: "تاريخ الاستحقاق", id: "dueDate", align: "right" },
];

const WEBHOOK_COLUMNS: DataTableColumn[] = [
  { label: "المزود", id: "provider" },
  { label: "الحدث", id: "eventType" },
  { label: "الحالة", id: "status" },
  { label: "التاريخ", id: "createdAt" },
];

function ChangeBadge({ value, good }: { value: number; good?: "up" | "down" }) {
  const isGood =
    good === "up" ? value >= 0 : good === "down" ? value <= 0 : true;
  const isUp = value >= 0;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-0.5 text-xs font-medium",
        isUp
          ? isGood
            ? "text-success-600"
            : "text-danger-600"
          : isGood
            ? "text-success-600"
            : "text-danger-600",
      )}
    >
      {isUp ? (
        <ArrowUpRight className="h-3 w-3" />
      ) : (
        <ArrowDownRight className="h-3 w-3" />
      )}
      {Math.abs(value).toFixed(1)}%
    </span>
  );
}

export default function AdminFinancePage() {
  const { data, isLoading, isError } = useGetAdminFinanceOverviewQuery();

  const summaryCards = useMemo(() => {
    const s = data?.summary;
    if (!s) return [];
    return [
      {
        label: "الإيرادات",
        value: fmtCurrency(s.revenue),
        change: s.revenueChange,
        icon: DollarSign,
        sub: `${s.activeClients} عميل نشط`,
        className: "",
        good: "up" as const,
      },
      {
        label: "إجمالي الفواتير",
        value: fmtCurrency(s.invoicesTotal),
        change: s.invoicesChange,
        icon: FileText,
        sub: `${s.invoicesCount} فاتورة`,
        className: "",
        good: "up" as const,
      },
      {
        label: "المدفوعات المعلقة",
        value: fmtCurrency(s.pending),
        icon: Clock,
        sub: `${s.pendingLateCount} متأخرة`,
        className: "bg-warning-100/50 border-warning-200 text-warning-600",
      },
      {
        label: "صافي الربح",
        value: fmtCurrency(s.netProfit),
        change: s.netProfitChange,
        icon: PiggyBank,
        sub: `معدل التحصيل ${fmtPercent(s.collectionRate)}`,
        className: "",
        good: "up" as const,
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
              {isLoading ? "—" : card.value}
            </p>
            {card.change !== undefined && (
              <p className="text-xs text-portal-note-text mt-1 flex items-center gap-1">
                <ChangeBadge value={card.change} good={card.good} />
                <span>عن الشهر الماضي</span>
              </p>
            )}
            {card.sub && (
              <p className="text-xs text-portal-note-text mt-1">{card.sub}</p>
            )}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <SurfaceCard title="توزيع الأعمار (Aging)" className="lg:col-span-1">
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3, 4].map((i) => (
                <div
                  key={i}
                  className="h-12 animate-pulse rounded-xl bg-portal-card-border"
                />
              ))}
            </div>
          ) : (
            <div className="space-y-3">
              {(data?.aging ?? []).map((bucket) => {
                const totalAging = (data?.aging ?? []).reduce(
                  (s, b) => s + b.amount,
                  0,
                );
                const pct =
                  totalAging > 0
                    ? ((bucket.amount / totalAging) * 100).toFixed(0)
                    : "0";
                return (
                  <div key={bucket.label}>
                    <div className="flex items-center justify-between text-sm mb-1">
                      <span className="text-natural-100">{bucket.label}</span>
                      <span className="text-portal-note-text">
                        {fmtCurrency(bucket.amount)}{" "}
                        <span className="text-xs">({bucket.count})</span>
                      </span>
                    </div>
                    <div className="h-2 w-full rounded-full bg-portal-divider overflow-hidden">
                      <div
                        className={cn(
                          "h-full rounded-full",
                          bucket.label.includes("+90")
                            ? "bg-danger-500"
                            : bucket.label.includes("61")
                              ? "bg-warning-500"
                              : "bg-secondary-500",
                        )}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
              {(data?.aging ?? []).length === 0 && (
                <p className="text-sm text-portal-note-text text-center py-4">
                  لا توجد بيانات للعرض
                </p>
              )}
            </div>
          )}
        </SurfaceCard>

        <SurfaceCard title="التدفق النقدي" className="lg:col-span-2">
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div
                  key={i}
                  className="h-8 animate-pulse rounded-xl bg-portal-card-border"
                />
              ))}
            </div>
          ) : (
            <div className="space-y-2">
              {(data?.cashflow ?? []).slice(0, 12).map((item) => {
                const maxVal = Math.max(
                  ...(data?.cashflow ?? []).map((c) => Math.max(c.income, c.expenses)),
                  1,
                );
                const incomePct = (item.income / maxVal) * 100;
                const expensePct = (item.expenses / maxVal) * 100;
                return (
                  <div key={item.label}>
                    <div className="flex items-center justify-between text-xs text-portal-note-text mb-1">
                      <span>{item.label}</span>
                      <div className="flex items-center gap-3">
                        <span className="text-success-600">
                          وارد {fmtCurrency(item.income)}
                        </span>
                        <span className="text-danger-600">
                          صادر {fmtCurrency(item.expenses)}
                        </span>
                      </div>
                    </div>
                    <div className="flex gap-1 h-4">
                      <div
                        className="bg-success-400 rounded-r-full"
                        style={{ width: `${incomePct}%` }}
                      />
                      <div
                        className="bg-danger-400 rounded-l-full"
                        style={{ width: `${expensePct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
              {(data?.cashflow ?? []).length === 0 && (
                <p className="text-sm text-portal-note-text text-center py-4">
                  لا توجد بيانات تدفق نقدي
                </p>
              )}
            </div>
          )}
        </SurfaceCard>
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

        <SurfaceCard title="أفضل العملاء">
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="h-16 animate-pulse rounded-xl bg-portal-card-border"
                />
              ))}
            </div>
          ) : (
            <div className="space-y-3">
              {(data?.topClients ?? []).map((client) => (
                <div
                  key={client.clientId}
                  className="flex items-center justify-between p-3 rounded-xl border border-portal-card-border"
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-natural-100 truncate">
                      {client.companyName}
                    </p>
                    <p className="text-xs text-portal-note-text">
                      {client.invoiceCount} فاتورة · {client.paymentCount} دفعة
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-natural-100">
                      {fmtCurrency(client.revenue)}
                    </p>
                    <p className="text-xs text-success-600">
                      {fmtPercent(client.collectionRate)} تحصيل
                    </p>
                  </div>
                </div>
              ))}
              {(data?.topClients ?? []).length === 0 && (
                <p className="text-sm text-portal-note-text text-center py-4">
                  لا يوجد عملاء
                </p>
              )}
            </div>
          )}
        </SurfaceCard>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <SurfaceCard title="طرق الدفع">
          <DataTable
            columns={[
              { id: "method", label: "طريقة الدفع", align: "right" },
              { id: "count", label: "عدد المعاملات", align: "right" },
              { id: "amount", label: "المبلغ", align: "right" },
              { id: "percentage", label: "النسبة", align: "right" },
            ]}
            data={data?.paymentMethodDistribution ?? []}
            isLoading={isLoading}
            isError={false}
            emptyState={{
              icon: CreditCard,
              message: "لا توجد طرق دفع مسجلة",
              hint: "لم يتم تسجيل أي معاملات دفع بعد.",
            }}
            renderRow={(item: { method: string; count: number; amount: number; percentage: number }) => (
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
                <td className="py-3 px-2 text-right text-sm text-portal-note-text">
                  {fmtPercent(item.percentage)}
                </td>
              </tr>
            )}
          />
        </SurfaceCard>

        <SurfaceCard title="اتجاه الإيرادات">
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3, 4].map((i) => (
                <div
                  key={i}
                  className="h-8 animate-pulse rounded-xl bg-portal-card-border"
                />
              ))}
            </div>
          ) : (
            <div className="space-y-2">
              {(data?.revenueTrend ?? []).slice(0, 12).map((item) => {
                const maxVal = Math.max(
                  ...(data?.revenueTrend ?? []).map((r) =>
                    Math.max(r.income, r.invoiced),
                  ),
                  1,
                );
                const incomePct = (item.income / maxVal) * 100;
                const invoicedPct = (item.invoiced / maxVal) * 100;
                return (
                  <div key={item.label}>
                    <div className="flex items-center justify-between text-xs text-portal-note-text mb-1">
                      <span>{item.label}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-success-600">
                          {fmtCurrency(item.income)}
                        </span>
                        <span className="text-primary-600">
                          {fmtCurrency(item.invoiced)}
                        </span>
                      </div>
                    </div>
                    <div className="flex gap-0.5 h-3 items-end">
                      <div
                        className="bg-success-400 rounded-t-sm"
                        style={{ width: `${Math.max(incomePct, 2)}%`, height: `${Math.max(incomePct, 2)}%` }}
                        title={`وارد: ${fmtCurrency(item.income)}`}
                      />
                      <div
                        className="bg-primary-400 rounded-t-sm"
                        style={{ width: `${Math.max(invoicedPct, 2)}%`, height: `${Math.max(invoicedPct, 2)}%` }}
                        title={`فوترة: ${fmtCurrency(item.invoiced)}`}
                      />
                    </div>
                  </div>
                );
              })}
              {(data?.revenueTrend ?? []).length === 0 && (
                <p className="text-sm text-portal-note-text text-center py-4">
                  لا توجد بيانات اتجاه للإيرادات
                </p>
              )}
              <div className="flex items-center gap-4 pt-2 text-xs text-portal-note-text">
                <span className="flex items-center gap-1">
                  <span className="w-3 h-3 rounded-sm bg-success-400" /> وارد
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-3 h-3 rounded-sm bg-primary-400" /> فواتير
                </span>
              </div>
            </div>
          )}
        </SurfaceCard>
      </div>

      {data?.alerts && data.alerts.length > 0 && (
        <SurfaceCard title="التنبيهات المالية">
          <div className="space-y-3">
            {data.alerts.map((alert) => (
              <div
                key={alert.id}
                className="flex items-center justify-between p-3 rounded-xl border border-danger-200 bg-danger-50/50"
              >
                <div className="flex items-center gap-3">
                  <AlertCircle className="h-5 w-5 text-danger-500 shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-danger-700">
                      {alert.client}
                    </p>
                    <p className="text-xs text-danger-500">
                      {alert.type === "OVERDUE" ? "فاتورة متأخرة" : alert.type}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-danger-700">
                    {fmtCurrency(alert.amount)}
                  </p>
                  <p className="text-xs text-danger-500">
                    {new Date(alert.date).toLocaleDateString("ar-SA")}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </SurfaceCard>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <SurfaceCard title="مؤشرات إضافية">
          <div className="grid grid-cols-2 gap-4">
            {data?.summary && (
              <>
                <div className="p-4 rounded-xl border border-portal-card-border text-center">
                  <p className="text-xs text-portal-note-text">
                    الفشل في الدفع
                  </p>
                  <p className="text-lg font-semibold text-danger-600">
                    {fmtCurrency(data.summary.failedPaymentsValue)}
                  </p>
                  <p className="text-xs text-portal-note-text">
                    {data.summary.failedPaymentsCount} معاملة
                  </p>
                </div>
                <div className="p-4 rounded-xl border border-portal-card-border text-center">
                  <p className="text-xs text-portal-note-text">معدل الاسترداد</p>
                  <p className="text-lg font-semibold text-natural-100">
                    {fmtPercent(data.refundRate)}
                  </p>
                </div>
                <div className="p-4 rounded-xl border border-portal-card-border text-center">
                  <p className="text-xs text-portal-note-text">
                    متوسط الفاتورة
                  </p>
                  <p className="text-lg font-semibold text-natural-100">
                    {fmtCurrency(data.summary.averageInvoice)}
                  </p>
                </div>
                <div className="p-4 rounded-xl border border-portal-card-border text-center">
                  <p className="text-xs text-portal-note-text">
                    إجمالي الرواتب
                  </p>
                  <p className="text-lg font-semibold text-natural-100">
                    {fmtCurrency(data.summary.salariesTotal)}
                  </p>
                </div>
              </>
            )}
          </div>
        </SurfaceCard>

        <SurfaceCard title="أكثر الفواتير تأخراً">
          <DataTable
            columns={OVERDUE_COLUMNS}
            data={data?.topOverdueInvoices ?? []}
            isLoading={isLoading}
            isError={false}
            emptyState={OVERDUE_EMPTY_STATE}
            renderRow={(inv: { id: string; invoiceNumber: string; clientName: string; amount: number; dueDate: string; daysOverdue: number }) => (
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
    </div>
  );
}
