"use client";

import { use } from "react";
import { useGetInvoiceByIdQuery } from "@/features/finance/financeApi";
import { FinanceStatusBadge } from "@/components/dashboard/finance/FinanceStatusBadge";
import { FinanceDetailBreadcrumb } from "@/components/dashboard/finance/shared/FinanceDetailBreadcrumb";
import { FinanceDetailSkeleton } from "@/components/dashboard/finance/shared/FinanceDetailSkeleton";
import { FinanceDetailError } from "@/components/dashboard/finance/shared/FinanceDetailError";
import {
  TimelineComponent,
  TimelineItem,
} from "@/components/dashboard/finance/TimelineComponent";
import { SurfaceCard } from "@/components/design-system/SurfaceCard";
import { ActionButton } from "@/components/design-system/ActionButton";
import { ProgressBar } from "@/components/design-system/ProgressBar";
import { DataTable } from "@/components/design-system/DataTable";
import { CurrencyDisplay } from "@/components/design-system/CurrencyDisplay";
import {
  Download,
  Printer,
  Send,
  Plus,
  CreditCard,
  History,
  AlertCircle,
  Copy,
  Building2,
  CalendarClock,
  FileText,
  Hash,
  CheckCircle2,
  Bell,
} from "lucide-react";
import Link from "next/link";

export default function InvoiceDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const { data: invoice, isLoading, error } = useGetInvoiceByIdQuery(id);

  if (isLoading) {
    return <FinanceDetailSkeleton />;
  }

  if (error || !invoice) {
    return (
      <FinanceDetailError
        title="عذراً، لم يتم العثور على الفاتورة"
        hint="قد يكون الرابط غير صحيح أو تم نقل الفاتورة."
        backHref="/dashboard/finance/invoices"
        backLabel="العودة لقائمة الفواتير"
      />
    );
  }

  const payments = invoice.payments || [];
  const paidAmount = payments.reduce((sum, p) => sum + p.amount, 0);
  const remainingAmount = invoice.amount - paidAmount;
  const collectionRate =
    invoice.amount > 0 ? Math.round((paidAmount / invoice.amount) * 100) : 0;

  // Map ledger history to timeline
  const timeline: TimelineItem[] =
    (invoice as any).history?.map((log: any) => ({
      id: log.id,
      event: log.action,
      date: new Date(log.createdAt).toLocaleString("ar-SA-u-nu-latn"),
      user: log.userId || "النظام",
      status: "success",
    })) || [];

  const handleCopyNumber = () => {
    navigator.clipboard.writeText(invoice.invoiceNumber);
  };

  return (
    <div className="space-y-5 animate-in fade-in duration-500">
      {/* Breadcrumb + Actions */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <FinanceDetailBreadcrumb
          items={[
            { label: "المالية", href: "/dashboard/finance" },
            { label: "الفواتير", href: "/dashboard/finance/invoices" },
            { label: invoice.invoiceNumber },
          ]}
        />
        <div className="flex gap-2">
          <ActionButton
            variant="outline"
            size="sm"
            icon={<Printer className="w-4 h-4" />}
            onClick={() => window.print()}
          >
            طباعة
          </ActionButton>
          <ActionButton
            variant="outline"
            size="sm"
            icon={<Download className="w-4 h-4" />}
          >
            تحميل PDF
          </ActionButton>
          <ActionButton
            variant="primary"
            size="sm"
            icon={<Send className="w-4 h-4" />}
          >
            إرسال للعميل
          </ActionButton>
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-3">
        {/* ─── Main Column (2/3) ─── */}
        <div className="lg:col-span-2 space-y-5">
          {/* Invoice Header Card */}
          <SurfaceCard className="border-none shadow-md overflow-hidden">
            <div className="bg-secondary-500 h-2 w-full" />
            <div className="px-6 py-5 border-b border-portal-divider flex flex-row items-start justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Hash className="w-4 h-4 text-portal-note-text" />
                  <h2 className="text-2xl font-mono font-bold">
                    {invoice.invoiceNumber}
                  </h2>
                  <ActionButton
                    variant="ghost"
                    size="sm"
                    className="h-7 w-7 p-0 hover:bg-secondary-50"
                    onClick={handleCopyNumber}
                    title="نسخ الرقم"
                  >
                    <Copy className="w-3.5 h-3.5 text-portal-note-text" />
                  </ActionButton>
                </div>
                <p className="text-sm text-portal-note-text">
                  أُنشئت بتاريخ:{" "}
                  {new Date(invoice.createdAt).toLocaleDateString("ar-SA-u-nu-latn")}
                </p>
              </div>
              <FinanceStatusBadge
                status={invoice.status}
                className="text-base px-4 py-1.5 shrink-0"
              />
            </div>

            <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="rounded-2xl border-[1.5px] border-portal-card-border bg-portal-bg p-4">
                <p className="text-sm text-portal-note-text mb-1">العميل</p>
                <p className="text-base font-bold text-natural-100">{invoice.client?.companyName || "N/A"}</p>
                {invoice.contract?.title && (
                  <p className="text-xs text-portal-note-text mt-0.5">العقد: {invoice.contract.title}</p>
                )}
              </div>
              <div className="rounded-2xl border-[1.5px] border-portal-card-border bg-portal-bg p-4">
                <p className="text-sm text-portal-note-text mb-1">تاريخ الاستحقاق</p>
                <p className="text-base font-bold text-danger-600">{new Date(invoice.dueDate).toLocaleDateString("ar-SA-u-nu-latn")}</p>
              </div>
              <div className="rounded-2xl border-[1.5px] border-portal-card-border bg-portal-bg p-4">
                <p className="text-sm text-portal-note-text mb-1">القيمة الإجمالية</p>
                <p className="text-base font-bold text-natural-100"><CurrencyDisplay amount={invoice.amount} /></p>
              </div>
            </div>
          </SurfaceCard>

          {/* Amount Summary with Progress */}
          <SurfaceCard
            title="تفاصيل المبالغ"
            icon={CreditCard}
            className="border-none shadow-sm"
          >
            <div className="space-y-5">
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-portal-note-text">نسبة التحصيل</span>
                  <span className="font-bold">{collectionRate}%</span>
                </div>
                <ProgressBar value={collectionRate} size="md" />
              </div>

              <div className="grid grid-cols-3 gap-4 pt-2">
                <div className="text-center p-4 rounded-2xl bg-badge-gray-bg">
                  <p className="text-xs text-portal-note-text mb-1">الإجمالي</p>
                  <p className="text-xl font-bold">
                    <CurrencyDisplay amount={invoice.amount} />
                  </p>
                </div>
                <div className="text-center p-4 rounded-2xl bg-success-100/50">
                  <p className="text-xs text-success-600 mb-1">المدفوع</p>
                  <p className="text-xl font-bold text-success-600">
                    <CurrencyDisplay amount={paidAmount} />
                  </p>
                </div>
                <div className="text-center p-4 rounded-2xl bg-danger-100/50">
                  <p className="text-xs text-danger-600 mb-1">المتبقي</p>
                  <p className="text-xl font-bold text-danger-600">
                    <CurrencyDisplay amount={remainingAmount} />
                  </p>
                </div>
              </div>
            </div>
          </SurfaceCard>

          {/* Payment History */}
          <SurfaceCard
            title="تاريخ المدفوعات"
            description={`${payments.length} دفعة مسجلة`}
            icon={History}
            action={
              <ActionButton
                variant="outline"
                size="sm"
                icon={<Plus className="w-3 h-3" />}
                onClick={() => alert("سيتم فتح نموذج تسجيل الدفعة")}
              >
                إضافة دفعة
              </ActionButton>
            }
            className="border-none shadow-md"
          >
            <DataTable
              columns={[
                { id: "id", label: "رقم العملية" },
                { id: "amount", label: "المبلغ" },
                { id: "method", label: "الطريقة" },
                { id: "status", label: "الحالة" },
                { id: "date", label: "التاريخ", align: "left" },
              ]}
              data={payments}
              isLoading={isLoading}
              isError={false}
              emptyState={{
                icon: CreditCard,
                message: "لا توجد عمليات دفع مسجلة بعد",
                hint: "قم بتسجيل دفعة جديدة للفاتورة.",
              }}
              renderRow={(p) => (
                <tr className="border-b-[1.5px] border-portal-divider">
                  <td className="px-5 py-4 font-mono text-[10px]">
                    {p.id.substring(0, 8)}...
                  </td>
                  <td className="px-5 py-4 font-bold">
                    <CurrencyDisplay amount={p.amount} />
                  </td>
                  <td className="px-5 py-4">{p.method}</td>
                  <td className="px-5 py-4">
                    <FinanceStatusBadge status={p.status} />
                  </td>
                  <td className="px-5 py-4 text-left text-xs text-portal-note-text">
                    {new Date(p.date).toLocaleDateString("ar-SA-u-nu-latn")}
                  </td>
                </tr>
              )}
            />
          </SurfaceCard>
        </div>

        {/* ─── Sidebar (1/3) ─── */}
        <div className="space-y-5">
          <SurfaceCard className="border-none shadow-sm">
            <div className="p-4 space-y-2">
              <ActionButton
                variant="primary"
                className="w-full justify-center"
                icon={<Plus className="w-4 h-4" />}
                onClick={() => alert("سيتم فتح نموذج تسجيل الدفعة")}
              >
                تسجيل دفعة جديدة
              </ActionButton>
              <ActionButton
                variant="outline"
                className="w-full justify-center"
                icon={<Bell className="w-4 h-4" />}
                onClick={() => alert("سيتم إرسال تذكير للعميل")}
              >
                إرسال تذكير
              </ActionButton>
              <ActionButton
                variant="outline"
                className="w-full justify-center"
                icon={<CheckCircle2 className="w-4 h-4" />}
                onClick={() => alert("سيتم تحديث حالة الفاتورة")}
              >
                تحديث الحالة
              </ActionButton>
            </div>
          </SurfaceCard>

          <SurfaceCard
            title="سجل الأحداث"
            description="جميع التغييرات على الفاتورة"
            className="border-none shadow-md"
          >
            <TimelineComponent items={timeline} />
          </SurfaceCard>

          <SurfaceCard
            title="ملاحظات التدقيق"
            icon={AlertCircle}
            className="border-none shadow-sm"
            contentClassName="bg-alert-50/30"
          >
            <div className="space-y-3">
              <p className="text-sm text-alert-800">
                هذه الفاتورة جزء من عقد توريد مستمر. يرجى التأكد من مطابقة
                الدفعات مع تسليمات المشروع.
              </p>
              <ActionButton
                variant="ghost"
                size="sm"
                className="text-alert-700 h-auto p-0 text-xs"
              >
                إضافة ملاحظة جديدة
              </ActionButton>
            </div>
          </SurfaceCard>
        </div>
      </div>
    </div>
  );
}
