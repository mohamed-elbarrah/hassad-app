"use client";

import { use } from "react";
import { useGetInvoicesQuery } from "@/features/finance/financeApi";
import { useGetClientByIdQuery } from "@/features/clients/clientsApi";
import { FinanceStatusBadge } from "@/components/dashboard/finance/FinanceStatusBadge";
import { FinanceDetailBreadcrumb } from "@/components/dashboard/finance/shared/FinanceDetailBreadcrumb";
import { FinanceDetailSkeleton } from "@/components/dashboard/finance/shared/FinanceDetailSkeleton";
import { FinanceDetailError } from "@/components/dashboard/finance/shared/FinanceDetailError";
import { DataTable } from "@/components/design-system/DataTable";
import { SurfaceCard } from "@/components/design-system/SurfaceCard";
import { ActionButton } from "@/components/design-system/ActionButton";
import { InfoPanel } from "@/components/design-system/InfoPanel";
import { ProgressBar } from "@/components/design-system/ProgressBar";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/design-system/Tabs";
import {
  FileText,
  CreditCard,
  Building2,
  TrendingUp,
  History,
  Download,
} from "lucide-react";
import { CurrencyDisplay } from "@/components/design-system/CurrencyDisplay";

export default function ClientFinanceDetailPage({
  params,
}: {
  params: Promise<{ clientId: string }>;
}) {
  const { clientId } = use(params);

  const {
    data: client,
    isLoading: loadingClient,
    isError: clientError,
  } = useGetClientByIdQuery(clientId);
  const { data: invoicesData, isLoading: loadingInvoices } =
    useGetInvoicesQuery({ clientId });

  if (loadingClient || loadingInvoices) {
    return <FinanceDetailSkeleton />;
  }

  if (clientError || !client) {
    return (
      <FinanceDetailError
        title="العميل غير موجود"
        backHref="/dashboard/finance"
        backLabel="العودة للوحة المالية"
      />
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
    <div className="space-y-5 animate-in fade-in duration-500">
      <FinanceDetailBreadcrumb
        items={[
          { label: "المالية", href: "/dashboard/finance" },
          { label: "الوضع المالي للعميل" },
        ]}
      />

      <SurfaceCard
        className="border-none shadow-md overflow-hidden"
        contentClassName="p-6"
      >
        <div className="flex flex-col md:flex-row items-start justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-2xl bg-secondary-500 text-white">
              <Building2 className="w-8 h-8" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">{client.companyName}</h1>
              <p className="text-portal-note-text text-sm">
                معرف العميل: {client.id}
              </p>
            </div>
          </div>
          <ActionButton
            variant="outline"
            icon={<Download className="w-4 h-4" />}
          >
            تصدير التقرير المالي
          </ActionButton>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
          <div className="rounded-2xl border-[1.5px] border-portal-card-border bg-portal-bg p-4">
            <p className="text-sm text-portal-note-text mb-1">
              إجمالي قيمة العقود
            </p>
            <p className="text-xl font-bold text-natural-100">
              <CurrencyDisplay amount={totalValue} />
            </p>
          </div>
          <div className="rounded-2xl border-[1.5px] border-portal-card-border bg-portal-bg p-4">
            <p className="text-sm text-portal-note-text mb-1">
              المبالغ المحصلة
            </p>
            <p className="text-xl font-bold text-success-600">
              <CurrencyDisplay amount={totalPaid} />
            </p>
          </div>
          <div className="rounded-2xl border-[1.5px] border-portal-card-border bg-portal-bg p-4">
            <p className="text-sm text-portal-note-text mb-1">نسبة التحصيل</p>
            <p className="text-xl font-bold text-natural-100">
              {collectionRate.toFixed(1)}%
            </p>
            <ProgressBar value={collectionRate} size="sm" className="mt-2" />
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
            <DataTable
              columns={[
                { id: "number", label: "رقم الفاتورة" },
                { id: "amount", label: "المبلغ" },
                { id: "paid", label: "المدفوع" },
                { id: "status", label: "الحالة" },
                { id: "due", label: "تاريخ الاستحقاق", align: "left" },
              ]}
              data={invoices}
              isLoading={loadingInvoices}
              isError={false}
              emptyState={{
                icon: FileText,
                message: "لا توجد فواتير لهذا العميل",
                hint: "ستظهر الفواتير هنا فور إصدارها.",
              }}
              renderRow={(inv) => (
                <tr className="border-b-[1.5px] border-portal-divider">
                  <td className="px-5 py-4 font-mono font-bold text-xs">
                    {inv.id}
                  </td>
                  <td className="px-5 py-4">
                    <CurrencyDisplay amount={inv.amount} />
                  </td>
                  <td className="px-5 py-4 text-success-600">
                    <CurrencyDisplay
                      amount={
                        (inv as any).payments?.reduce(
                          (s: number, p: any) => s + p.amount,
                          0,
                        ) || 0
                      }
                    />
                  </td>
                  <td className="px-5 py-4">
                    <FinanceStatusBadge status={inv.status} />
                  </td>
                  <td className="px-5 py-4 text-left text-sm text-portal-note-text">
                    {new Date(inv.dueDate).toLocaleDateString(
                      "ar-SA-u-nu-latn",
                    )}
                  </td>
                </tr>
              )}
            />
          </SurfaceCard>
        </TabsContent>

        <TabsContent value="payments" className="mt-6">
          <SurfaceCard className="shadow-md border-none" contentClassName="p-0">
            <DataTable
              columns={[
                { id: "id", label: "رقم العملية" },
                { id: "amount", label: "المبلغ" },
                { id: "method", label: "طريقة الدفع" },
                { id: "status", label: "الحالة" },
                { id: "date", label: "التاريخ", align: "left" },
              ]}
              data={payments}
              isLoading={loadingInvoices}
              isError={false}
              emptyState={{
                icon: CreditCard,
                message: "لا توجد مدفوعات لهذا العميل",
                hint: "ستظهر المدفوعات هنا فور تسجيلها.",
              }}
              renderRow={(p) => (
                <tr className="border-b-[1.5px] border-portal-divider">
                  <td className="px-5 py-4 font-mono text-xs">{p.id}</td>
                  <td className="px-5 py-4 font-bold">
                    <CurrencyDisplay amount={p.amount} />
                  </td>
                  <td className="px-5 py-4">{p.method}</td>
                  <td className="px-5 py-4">
                    <FinanceStatusBadge status={p.status} />
                  </td>
                  <td className="px-5 py-4 text-left text-sm text-portal-note-text">
                    {new Date(p.date).toLocaleDateString("ar-SA-u-nu-latn")}
                  </td>
                </tr>
              )}
            />
          </SurfaceCard>
        </TabsContent>

        <TabsContent value="history" className="mt-6">
          <SurfaceCard className="shadow-md border-none" contentClassName="p-8">
            <div className="text-center text-portal-note-text">
              لا توجد عقود مؤرشفة لهذا العميل. جميع العقود الحالية نشطة.
            </div>
          </SurfaceCard>
        </TabsContent>
      </Tabs>
    </div>
  );
}
