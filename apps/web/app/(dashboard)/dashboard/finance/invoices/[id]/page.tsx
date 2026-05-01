"use client";

import { use } from "react";
import { useGetInvoiceByIdQuery } from "@/features/finance/financeApi";
import { FinanceStatusBadge } from "@/components/dashboard/finance/FinanceStatusBadge";
import { TimelineComponent, TimelineItem } from "@/components/dashboard/finance/TimelineComponent";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ChevronRight, Download, Printer, Send, Plus, CreditCard, History, AlertCircle, Loader2 } from "lucide-react";
import Link from "next/link";

export default function InvoiceDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { data: invoice, isLoading, error } = useGetInvoiceByIdQuery(id);
  
  if (isLoading) {
    return (
      <div className="h-[60vh] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !invoice) {
    return (
      <div className="h-[60vh] flex flex-col items-center justify-center gap-4 text-center">
        <AlertCircle className="w-12 h-12 text-rose-500" />
        <div>
          <h2 className="text-2xl font-bold">عذراً، لم يتم العثور على الفاتورة</h2>
          <p className="text-muted-foreground">قد يكون الرابط غير صحيح أو تم نقل الفاتورة.</p>
        </div>
        <Link href="/dashboard/finance/invoices">
          <Button variant="outline">العودة لقائمة الفواتير</Button>
        </Link>
      </div>
    );
  }

  const payments = invoice.payments || [];
  const paidAmount = payments.reduce((sum, p) => sum + p.amount, 0);
  const remainingAmount = invoice.amount - paidAmount;
  
  // Map ledger history to timeline
  const timeline: TimelineItem[] = (invoice as any).history?.map((log: any) => ({
    id: log.id,
    event: log.action,
    date: new Date(log.createdAt).toLocaleString('ar-SA'),
    user: log.userId || 'النظام',
    status: 'success'
  })) || [];

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Breadcrumbs / Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Link href="/dashboard/finance" className="hover:text-primary">المالية</Link>
          <ChevronRight className="w-4 h-4 rotate-180" />
          <Link href="/dashboard/finance/invoices" className="hover:text-primary">الفواتير</Link>
          <ChevronRight className="w-4 h-4 rotate-180" />
          <span className="text-foreground font-medium">{invoice.invoiceNumber}</span>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <Printer className="w-4 h-4 ml-2" />
            طباعة
          </Button>
          <Button variant="outline" size="sm">
            <Download className="w-4 h-4 ml-2" />
            تحميل PDF
          </Button>
          <Button size="sm">
            <Send className="w-4 h-4 ml-2" />
            إرسال للعميل
          </Button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main Details */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="border-none shadow-md overflow-hidden">
            <div className="bg-primary h-2 w-full" />
            <CardHeader className="flex flex-row items-start justify-between">
              <div>
                <CardTitle className="text-2xl font-mono">{invoice.invoiceNumber}</CardTitle>
                <CardDescription>بتاريخ: {new Date(invoice.createdAt).toLocaleDateString('ar-SA')}</CardDescription>
              </div>
              <FinanceStatusBadge status={invoice.status} className="text-lg px-4 py-1" />
            </CardHeader>
            <CardContent className="space-y-8">
              <div className="grid grid-cols-2 gap-8">
                <div>
                  <h4 className="text-sm font-semibold text-muted-foreground mb-2">العميل</h4>
                  <p className="text-lg font-bold">{invoice.client?.companyName || 'N/A'}</p>
                  <p className="text-sm text-muted-foreground">العقد: {invoice.contract?.title || 'N/A'}</p>
                </div>
                <div className="text-left">
                  <h4 className="text-sm font-semibold text-muted-foreground mb-2">تاريخ الاستحقاق</h4>
                  <p className="text-lg font-bold text-rose-600">{new Date(invoice.dueDate).toLocaleDateString('ar-SA')}</p>
                </div>
              </div>

              <Separator />

              <div className="space-y-4">
                <h4 className="font-semibold flex items-center gap-2">
                  <CreditCard className="w-4 h-4" />
                  تفاصيل المبالغ
                </h4>
                <div className="bg-muted/30 rounded-xl p-6 grid grid-cols-3 gap-4">
                  <div className="text-center">
                    <p className="text-xs text-muted-foreground mb-1">الإجمالي</p>
                    <p className="text-xl font-bold">{invoice.amount.toLocaleString()} ر.س</p>
                  </div>
                  <div className="text-center border-x border-muted-foreground/10">
                    <p className="text-xs text-muted-foreground mb-1">المدفوع</p>
                    <p className="text-xl font-bold text-emerald-600">{paidAmount.toLocaleString()} ر.س</p>
                  </div>
                  <div className="text-center">
                    <p className="text-xs text-muted-foreground mb-1">المتبقي</p>
                    <p className="text-xl font-bold text-rose-600">{remainingAmount.toLocaleString()} ر.س</p>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="font-semibold flex items-center gap-2">
                    <History className="w-4 h-4" />
                    تاريخ المدفوعات
                  </h4>
                  <Button variant="outline" size="sm" className="h-8">
                    <Plus className="w-3 h-3 ml-1" />
                    إضافة دفعة
                  </Button>
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
                    {payments.length > 0 ? payments.map((p) => (
                      <TableRow key={p.id}>
                        <TableCell className="font-mono text-[10px]">{p.id.substring(0, 8)}...</TableCell>
                        <TableCell className="font-bold">{p.amount.toLocaleString()} ر.س</TableCell>
                        <TableCell>{p.method}</TableCell>
                        <TableCell>
                          <FinanceStatusBadge status={p.status as any} />
                        </TableCell>
                        <TableCell className="text-left text-xs text-muted-foreground">{new Date(p.date).toLocaleDateString('ar-SA')}</TableCell>
                      </TableRow>
                    )) : (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                          لا توجد عمليات دفع مسجلة بعد
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar: Timeline & Actions */}
        <div className="space-y-6">
          <Card className="border-none shadow-md">
            <CardHeader>
              <CardTitle className="text-lg">الجدول الزمني للفاتورة</CardTitle>
              <CardDescription>تتبع جميع الأحداث المرتبطة بالفاتورة</CardDescription>
            </CardHeader>
            <CardContent>
              <TimelineComponent items={timeline} />
            </CardContent>
          </Card>

          <Card className="border-none shadow-md bg-amber-50/50 dark:bg-amber-500/5">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2 text-amber-700 dark:text-amber-400">
                <AlertCircle className="w-5 h-5" />
                ملاحظات التدقيق
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-amber-800 dark:text-amber-300">
                هذه الفاتورة جزء من عقد توريد مستمر. يرجى التأكد من مطابقة الدفعات مع تسليمات المشروع.
              </p>
              <Button variant="link" className="text-amber-700 p-0 h-auto mt-4 text-xs">إضافة ملاحظة جديدة</Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
