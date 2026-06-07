"use client";

import { use } from "react";
import { useGetInvoicesQuery } from "@/features/finance/financeApi";
import { useGetClientByIdQuery } from "@/features/clients/clientsApi";
import { FinanceStatusBadge } from "@/components/dashboard/finance/FinanceStatusBadge";
import { SurfaceCard } from "@/components/design-system/SurfaceCard";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ActionButton } from "@/components/design-system/ActionButton";
import { ProgressBar } from "@/components/design-system/ProgressBar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/design-system/Tabs";
import {
  ChevronRight,
  FileText,
  CreditCard,
  Building2,
  TrendingUp,
  History,
  Download,
  Loader2,
} from "lucide-react";
import Link from "next/link";

export default function ClientFinanceDetailPage({
  params,
}: {
  params: Promise<{ clientId: string }>;
}) {
  const { clientId } = use(params);

  const { data: client, isLoading: loadingClient } =
    useGetClientByIdQuery(clientId);
  const { data: invoicesData, isLoading: loadingInvoices } =
    useGetInvoicesQuery({ clientId });

  if (loadingClient || loadingInvoices) {
    return (
      <div className="h-[60vh] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-secondary-500" />
      </div>
    );
  }

  if (!client) {
    return (
      <div className="p-8 text-center text-neutral-300">
        العميل غير موجود
      </div>
    );
  }

  const invoices = invoicesData?.items || [];
  const payments = invoices.flatMap((inv) => (inv as any).payments || []);

  const totalValue = invoices.reduce((sum, inv) => sum + inv.amount, 0);
  const totalPaid = invoices.reduce(
    (sum, inv) =>
      sum +
      ((inv as any).payments?.reduce((s: number, p: any) => s + p.amount, 0) ||
        0),
    0,
  );
  const remaining = totalValue - totalPaid;
  const collectionRate = totalValue > 0 ? (totalPaid / totalValue) * 100 : 0;

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-2 text-sm text-neutral-300">
          <Link href="/dashboard/finance" className="hover:text-secondary-500">
            المالية
          </Link>
          <ChevronRight className="w-4 h-4 rotate-180" />
          <span className="text-natural-100 font-medium">
            الوضع المالي للعميل
          </span>
        </div>
        <ActionButton variant="outline" icon={<Download className="w-4 h-4" />}>
          تصدير التقرير المالي
        </ActionButton>
      </div>

      <SurfaceCard className="border-none shadow-md overflow-hidden bg-gradient-to-br from-secondary-500/5 via-transparent to-transparent" contentClassName="p-8">
        <div className="flex flex-col md:flex-row items-start justify-between gap-8">
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-2xl bg-secondary-500 text-white">
                <Building2 className="w-8 h-8" />
              </div>
              <div>
                <h1 className="text-3xl font-bold">{client.companyName}</h1>
                <p className="text-neutral-300">
                  معرف العميل: {client.id}
                </p>
              </div>
            </div>
            <div className="flex gap-4">
              <div className="bg-white dark:bg-neutral-900 px-4 py-2 rounded-xl shadow-sm border">
                <p className="text-xs text-neutral-300 mb-1">
                  إجمالي قيمة العقود
                </p>
                <p className="text-xl font-bold">
                  {totalValue.toLocaleString()} ر.س
                </p>
              </div>
              <div className="bg-white dark:bg-neutral-900 px-4 py-2 rounded-xl shadow-sm border">
                <p className="text-xs text-neutral-300 mb-1">
                  المبالغ المحصلة
                </p>
                <p className="text-xl font-bold text-success-600">
                  {totalPaid.toLocaleString()} ر.س
                </p>
              </div>
            </div>
          </div>

          <div className="w-full md:w-80 rounded-xl border border-portal-card-border bg-white/50 dark:bg-neutral-900/50 backdrop-blur-md shadow-sm">
            <div className="px-5 py-4 border-b border-portal-divider">
              <h3 className="text-sm font-medium">
                نسبة التحصيل
              </h3>
            </div>
            <div className="p-5 space-y-4">
              <div className="flex items-end justify-between">
                <span className="text-3xl font-bold">
                  {collectionRate.toFixed(1)}%
                </span>
                <TrendingUp className="w-5 h-5 text-success-500 mb-1" />
              </div>
              <ProgressBar value={collectionRate} size="md" />
              <p className="text-xs text-neutral-300">
                المتبقي: {remaining.toLocaleString()} ر.س
              </p>
            </div>
          </div>
        </div>
      </SurfaceCard>

      <Tabs defaultValue="invoices" className="w-full">
        <TabsList className="w-fit">
          <TabsTrigger value="invoices" className="rounded-lg gap-2">
            <FileText className="w-4 h-4" />
            الفواتير ({invoices.length})
          </TabsTrigger>
          <TabsTrigger value="payments" className="rounded-lg gap-2">
            <CreditCard className="w-4 h-4" />
            المدفوعات ({payments.length})
          </TabsTrigger>
          <TabsTrigger value="history" className="rounded-lg gap-2">
            <History className="w-4 h-4" />
            سجل العقود
          </TabsTrigger>
        </TabsList>

        <TabsContent value="invoices" className="mt-6">
          <SurfaceCard className="shadow-md border-none" contentClassName="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="pr-6">رقم الفاتورة</TableHead>
                  <TableHead>المبلغ</TableHead>
                  <TableHead>المدفوع</TableHead>
                  <TableHead>الحالة</TableHead>
                  <TableHead className="text-left pl-6">
                    تاريخ الاستحقاق
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {invoices.map((inv) => (
                  <TableRow key={inv.id}>
                    <TableCell className="pr-6 font-mono font-bold text-xs">
                      {inv.id}
                    </TableCell>
                    <TableCell>{inv.amount.toLocaleString()} ر.س</TableCell>
                    <TableCell className="text-success-600">
                      {(
                        (inv as any).payments?.reduce(
                          (s: number, p: any) => s + p.amount,
                          0,
                        ) || 0
                      ).toLocaleString()}{" "}
                      ر.س
                    </TableCell>
                    <TableCell>
                      <FinanceStatusBadge status={inv.status} />
                    </TableCell>
                    <TableCell className="text-left pl-6 text-sm text-neutral-300">
                      {new Date(inv.dueDate).toLocaleDateString(
                        "ar-SA-u-nu-latn",
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </SurfaceCard>
        </TabsContent>

        <TabsContent value="payments" className="mt-6">
          <SurfaceCard className="shadow-md border-none" contentClassName="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="pr-6">رقم العملية</TableHead>
                  <TableHead>المبلغ</TableHead>
                  <TableHead>طريقة الدفع</TableHead>
                  <TableHead>الحالة</TableHead>
                  <TableHead className="text-left pl-6">التاريخ</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {payments.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell className="pr-6 font-mono text-xs">
                      {p.id}
                    </TableCell>
                    <TableCell className="font-bold">
                      {p.amount.toLocaleString()} ر.س
                    </TableCell>
                    <TableCell>{p.method}</TableCell>
                    <TableCell>
                      <FinanceStatusBadge status={p.status} />
                    </TableCell>
                    <TableCell className="text-left pl-6 text-sm text-neutral-300">
                      {new Date(p.date).toLocaleDateString("ar-SA-u-nu-latn")}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </SurfaceCard>
        </TabsContent>

        <TabsContent value="history" className="mt-6">
          <SurfaceCard className="shadow-md border-none" contentClassName="p-8">
            <div className="text-center text-neutral-300">
              لا توجد عقود مؤرشفة لهذا العميل. جميع العقود الحالية نشطة.
            </div>
          </SurfaceCard>
        </TabsContent>
      </Tabs>
    </div>
  );
}
