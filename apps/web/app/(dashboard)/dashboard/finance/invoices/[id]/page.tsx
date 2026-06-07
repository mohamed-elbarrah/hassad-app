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
import { Separator } from "@/components/ui/separator";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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

  // Map ledger history to timeline
  const timeline: TimelineItem[] =
    (invoice as any).history?.map((log: any) => ({
      id: log.id,
      event: log.action,
      date: new Date(log.createdAt).toLocaleString("ar-SA-u-nu-latn"),
      user: log.userId || "النظام",
      status: "success",
    })) || [];

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Breadcrumbs / Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-2 text-sm text-neutral-300">
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
          <span className="text-natural-100 font-medium">
            {invoice.invoiceNumber}
          </span>
        </div>
        <div className="flex gap-2">
          <ActionButton variant="outline" size="sm" icon={<Printer className="w-4 h-4" />}>
            طباعة
          </ActionButton>
          <ActionButton variant="outline" size="sm" icon={<Download className="w-4 h-4" />}>
            تحميل PDF
          </ActionButton>
          <ActionButton variant="primary" size="sm" icon={<Send className="w-4 h-4" />}>
            إرسال للعميل
          </ActionButton>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main Details */}
        <div className="lg:col-span-2 space-y-6">
          <div className="rounded-xl border border-portal-card-border bg-natural-0 shadow-sm overflow-hidden">
            <div className="bg-secondary-500 h-2 w-full" />
            <div className="px-5 py-4 border-b border-portal-divider flex flex-row items-start justify-between">
              <div>
                <h2 className="text-2xl font-mono">
                  {invoice.invoiceNumber}
                </h2>
                <p className="text-portal-note-text">
                  بتاريخ:{" "}
                  {new Date(invoice.createdAt).toLocaleDateString(
                    "ar-SA-u-nu-latn",
                  )}
                </p>
              </div>
              <FinanceStatusBadge
                status={invoice.status}
                className="text-lg px-4 py-1"
              />
            </div>
            <div className="p-5 space-y-8">
              <div className="grid grid-cols-2 gap-8">
                <div>
                  <h4 className="text-sm font-semibold text-neutral-300 mb-2">
                    العميل
                  </h4>
                  <p className="text-lg font-bold">
                    {invoice.client?.companyName || "N/A"}
                  </p>
                  <p className="text-sm text-neutral-300">
                    العقد: {invoice.contract?.title || "N/A"}
                  </p>
                </div>
                <div className="text-left">
                  <h4 className="text-sm font-semibold text-neutral-300 mb-2">
                    تاريخ الاستحقاق
                  </h4>
                  <p className="text-lg font-bold text-danger-600">
                    {new Date(invoice.dueDate).toLocaleDateString(
                      "ar-SA-u-nu-latn",
                    )}
                  </p>
                </div>
              </div>

              <Separator />

              <div className="space-y-4">
                <h4 className="font-semibold flex items-center gap-2">
                  <CreditCard className="w-4 h-4" />
                  تفاصيل المبالغ
                </h4>
                <div className="bg-neutral-50/30 rounded-xl p-6 grid grid-cols-3 gap-4">
                  <div className="text-center">
                    <p className="text-xs text-neutral-300 mb-1">
                      الإجمالي
                    </p>
                    <p className="text-xl font-bold">
                      {invoice.amount.toLocaleString()} ر.س
                    </p>
                  </div>
                  <div className="text-center border-x border-neutral-300/10">
                    <p className="text-xs text-neutral-300 mb-1">
                      المدفوع
                    </p>
                    <p className="text-xl font-bold text-success-600">
                      {paidAmount.toLocaleString()} ر.س
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="text-xs text-neutral-300 mb-1">
                      المتبقي
                    </p>
                    <p className="text-xl font-bold text-danger-600">
                      {remainingAmount.toLocaleString()} ر.س
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="font-semibold flex items-center gap-2">
                    <History className="w-4 h-4" />
                    تاريخ المدفوعات
                  </h4>
                  <ActionButton variant="outline" size="sm" icon={<Plus className="w-3 h-3" />}>
                    إضافة دفعة
                  </ActionButton>
                </div>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>رقم العملية</TableHead>
                      <TableHead>المبلغ</TableHead>
                      <TableHead>الطريقة</TableHead>
                      <TableHead>الحالة</TableHead>
                      <TableHead className="text-left">التاريخ</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {payments.length > 0 ? (
                      payments.map((p) => (
                        <TableRow key={p.id}>
                          <TableCell className="font-mono text-[10px]">
                            {p.id.substring(0, 8)}...
                          </TableCell>
                          <TableCell className="font-bold">
                            {p.amount.toLocaleString()} ر.س
                          </TableCell>
                          <TableCell>{p.method}</TableCell>
                          <TableCell>
                            <FinanceStatusBadge status={p.status as any} />
                          </TableCell>
                          <TableCell className="text-left text-xs text-neutral-300">
                            {new Date(p.date).toLocaleDateString(
                              "ar-SA-u-nu-latn",
                            )}
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell
                          colSpan={5}
                          className="text-center py-8 text-neutral-300"
                        >
                          لا توجد عمليات دفع مسجلة بعد
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar: Timeline & Actions */}
        <div className="space-y-6">
          <SurfaceCard
            title="الجدول الزمني للفاتورة"
            description="تتبع جميع الأحداث المرتبطة بالفاتورة"
            className="border-none shadow-md"
          >
            <TimelineComponent items={timeline} />
          </SurfaceCard>

          <div className="rounded-xl border border-portal-card-border bg-alert-50/50 dark:bg-alert-500/5 shadow-sm">
            <div className="px-5 py-4 border-b border-portal-divider">
              <h3 className="text-lg flex items-center gap-2 text-alert-700 dark:text-alert-400">
                <AlertCircle className="w-5 h-5" />
                ملاحظات التدقيق
              </h3>
            </div>
            <div className="p-5">
              <p className="text-sm text-alert-800 dark:text-alert-300">
                هذه الفاتورة جزء من عقد توريد مستمر. يرجى التأكد من مطابقة
                الدفعات مع تسليمات المشروع.
              </p>
              <ActionButton
                variant="ghost"
                className="text-alert-700 p-0 h-auto mt-4 text-xs"
              >
                إضافة ملاحظة جديدة
              </ActionButton>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
