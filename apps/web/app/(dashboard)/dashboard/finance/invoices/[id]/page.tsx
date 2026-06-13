"use client";

import { use } from "react";
import { useGetInvoiceByIdQuery } from "@/features/finance/financeApi";
import { FinanceStatusBadge } from "@/components/dashboard/finance/FinanceStatusBadge";
import {
  TimelineComponent,
  TimelineItem,
} from "@/components/dashboard/finance/TimelineComponent";
import { SurfaceCard } from "@/components/design-system/SurfaceCard";
import { ActionButton } from "@/components/design-system/ActionButton";
import { ProgressBar } from "@/components/design-system/ProgressBar";
import { DataTable } from "@/components/design-system/DataTable";
import {
  ChevronRight,
  Download,
  Printer,
  Send,
  Plus,
  CreditCard,
  History,
  AlertCircle,
  Loader2,
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
    return (
      <div className="h-[60vh] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-secondary-500" />
      </div>
    );
  }

  if (error || !invoice) {
    return (
      <div className="h-[60vh] flex flex-col items-center justify-center gap-4 text-center">
        <AlertCircle className="w-12 h-12 text-danger-500" />
        <div>
          <h2 className="text-2xl font-bold">
            عذراً، لم يتم العثور على الفاتورة
          </h2>
          <p className="text-neutral-300">
            قد يكون الرابط غير صحيح أو تم نقل الفاتورة.
          </p>
        </div>
        <Link href="/dashboard/finance/invoices">
          <ActionButton variant="outline">العودة لقائمة الفواتير</ActionButton>
        </Link>
      </div>
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
        <div className="flex items-center gap-2 text-sm text-neutral-400">
          <Link href="/dashboard/finance" className="hover:text-secondary-500">
            المالية
          </Link>
          <ChevronRight className="w-4 h-4 rotate-180" />
          <Link
            href="/dashboard/finance/invoices"
            className="hover:text-secondary-500"
          >
            الفواتير
          </Link>
          <ChevronRight className="w-4 h-4 rotate-180" />
          <span className="text-natural-100 font-medium">{invoice.invoiceNumber}</span>
        </div>
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
            {/* Top accent bar */}
            <div className="bg-secondary-500 h-2 w-full" />

            {/* Header row */}
            <div className="px-6 py-5 border-b border-portal-divider flex flex-row items-start justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Hash className="w-4 h-4 text-neutral-400" />
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
                    <Copy className="w-3.5 h-3.5 text-neutral-400" />
                  </ActionButton>
                </div>
                <p className="text-sm text-neutral-400">
                  أُنشئت بتاريخ:{" "}
                  {new Date(invoice.createdAt).toLocaleDateString("ar-SA-u-nu-latn")}
                </p>
              </div>
              <FinanceStatusBadge
                status={invoice.status}
                className="text-base px-4 py-1.5 shrink-0"
              />
            </div>

            {/* Info Grid */}
            <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-xl bg-secondary-50">
                  <Building2 className="w-4 h-4 text-secondary-600" />
                </div>
                <div>
                  <p className="text-xs text-neutral-400 mb-0.5">العميل</p>
                  <p className="text-sm font-bold">
                    {invoice.client?.companyName || "N/A"}
                  </p>
                  <p className="text-xs text-neutral-400 mt-0.5">
                    العقد:{" "}
                    <span className="font-medium">
                      {invoice.contract?.title || "N/A"}
                    </span>
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="p-2 rounded-xl bg-danger-50">
                  <CalendarClock className="w-4 h-4 text-danger-600" />
                </div>
                <div>
                  <p className="text-xs text-neutral-400 mb-0.5">تاريخ الاستحقاق</p>
                  <p className="text-sm font-bold text-danger-600">
                    {new Date(invoice.dueDate).toLocaleDateString("ar-SA-u-nu-latn")}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="p-2 rounded-xl bg-success-50">
                  <FileText className="w-4 h-4 text-success-600" />
                </div>
                <div>
                  <p className="text-xs text-neutral-400 mb-0.5">القيمة الإجمالية</p>
                  <p className="text-sm font-bold">
                    {invoice.amount.toLocaleString()} ر.س
                  </p>
                </div>
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
              {/* Progress bar */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-neutral-400">نسبة التحصيل</span>
                  <span className="font-bold">{collectionRate}%</span>
                </div>
                <ProgressBar value={collectionRate} size="md" />
              </div>

              {/* Three values */}
              <div className="grid grid-cols-3 gap-4 pt-2">
                <div className="text-center p-4 rounded-2xl bg-neutral-50/50">
                  <p className="text-xs text-neutral-400 mb-1">الإجمالي</p>
                  <p className="text-xl font-bold">
                    {invoice.amount.toLocaleString()}
                  </p>
                  <p className="text-xs text-neutral-400">ر.س</p>
                </div>
                <div className="text-center p-4 rounded-2xl bg-success-50/50">
                  <p className="text-xs text-success-600 mb-1">المدفوع</p>
                  <p className="text-xl font-bold text-success-600">
                    {paidAmount.toLocaleString()}
                  </p>
                  <p className="text-xs text-success-500">ر.س</p>
                </div>
                <div className="text-center p-4 rounded-2xl bg-danger-50/50">
                  <p className="text-xs text-danger-600 mb-1">المتبقي</p>
                  <p className="text-xl font-bold text-danger-600">
                    {remainingAmount.toLocaleString()}
                  </p>
                  <p className="text-xs text-danger-500">ر.س</p>
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
                    {p.amount.toLocaleString()} ر.س
                  </td>
                  <td className="px-5 py-4">{p.method}</td>
                  <td className="px-5 py-4">
                    <FinanceStatusBadge status={p.status} />
                  </td>
                  <td className="px-5 py-4 text-left text-xs text-neutral-400">
                    {new Date(p.date).toLocaleDateString("ar-SA-u-nu-latn")}
                  </td>
                </tr>
              )}
            />
          </SurfaceCard>
        </div>

        {/* ─── Sidebar (1/3) ─── */}
        <div className="space-y-5">
          {/* Quick Actions */}
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

          {/* Timeline */}
          <SurfaceCard
            title="سجل الأحداث"
            description="جميع التغييرات على الفاتورة"
            className="border-none shadow-md"
          >
            <TimelineComponent items={timeline} />
          </SurfaceCard>

          {/* Audit Notes */}
          <SurfaceCard
            title="ملاحظات التدقيق"
            icon={AlertCircle}
            className="border-none shadow-sm"
            contentClassName="bg-alert-50/30 dark:bg-alert-500/5"
          >
            <div className="space-y-3">
              <p className="text-sm text-alert-800 dark:text-alert-300">
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
