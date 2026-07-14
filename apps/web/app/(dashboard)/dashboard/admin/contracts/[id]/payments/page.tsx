"use client";

import { use } from "react";
import { CreditCard, Info } from "lucide-react";
import { SurfaceCard } from "@/components/design-system/SurfaceCard";
import { AdminStatusBadge } from "@/components/dashboard/admin/shared/AdminStatusBadge";
import { AdminEmptyState } from "@/components/dashboard/admin/shared/AdminEmptyState";
import { useGetAdminContractByIdQuery } from "@/features/admin/adminContractsApi";

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("ar-SA", {
    style: "currency",
    currency: "SAR",
    minimumFractionDigits: 0,
  }).format(value);
}

function formatDate(date: string | null | undefined): string {
  if (!date) return "—";
  return new Date(date).toLocaleDateString("ar-SA");
}

export default function ContractPaymentsTab({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const { data: contract } = useGetAdminContractByIdQuery(id);

  if (!contract) return null;

  const paidInvoices = contract.invoices.filter(
    (inv) => inv.status === "PAID" || inv.paidAt,
  );

  if (paidInvoices.length === 0) {
    return (
      <div className="space-y-5">
        <AdminEmptyState
          icon={CreditCard}
          title="لا توجد مدفوعات"
          description="لم يتم تسجيل أي مدفوعات لهذا العقد بعد. ستظهر المدفوعات هنا عند دفع الفواتير المرتبطة."
        />
        <SurfaceCard title="ملخص المدفوعات">
          <div className="flex items-start gap-3 p-4 rounded-xl border border-portal-card-border">
            <Info className="h-5 w-5 text-secondary-500 mt-0.5" />
            <div>
              <p className="text-xs text-portal-note-text">
                المدفوعات مرتبطة بالفواتير المسددة
              </p>
              <p className="text-sm text-natural-100 mt-1">
                يتم ربط المدفوعات تلقائياً عند تسديد الفواتير. عدد الفواتير
                الصادرة: {contract.invoices.length}
              </p>
            </div>
          </div>
        </SurfaceCard>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <SurfaceCard title={`المدفوعات (${paidInvoices.length})`}>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-portal-divider">
                <th className="py-3 px-2 text-right text-xs font-medium text-portal-note-text">
                  رقم الفاتورة
                </th>
                <th className="py-3 px-2 text-right text-xs font-medium text-portal-note-text">
                  المبلغ
                </th>
                <th className="py-3 px-2 text-right text-xs font-medium text-portal-note-text">
                  الحالة
                </th>
                <th className="py-3 px-2 text-right text-xs font-medium text-portal-note-text">
                  تاريخ الدفع
                </th>
              </tr>
            </thead>
            <tbody>
              {paidInvoices.map((invoice) => (
                <tr
                  key={invoice.id}
                  className="border-b border-portal-divider last:border-0"
                >
                  <td className="py-3 px-2 text-right">
                    <div className="flex items-center gap-2">
                      <CreditCard className="h-4 w-4 text-success-500 shrink-0" />
                      <span className="text-sm font-medium text-natural-100">
                        {invoice.invoiceNumber}
                      </span>
                    </div>
                  </td>
                  <td className="py-3 px-2 text-right text-sm text-natural-100">
                    {formatCurrency(invoice.amount)}
                  </td>
                  <td className="py-3 px-2 text-right">
                    <AdminStatusBadge
                      domain="invoice"
                      status={invoice.status}
                    />
                  </td>
                  <td className="py-3 px-2 text-right text-sm text-portal-note-text">
                    {formatDate(invoice.paidAt)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </SurfaceCard>

      <SurfaceCard title="ملخص المدفوعات">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 rounded-xl border border-portal-card-border text-center">
            <p className="text-2xl font-semibold text-natural-100">
              {paidInvoices.length}
            </p>
            <p className="text-xs text-portal-note-text mt-1">
              إجمالي المدفوعات
            </p>
          </div>
          <div className="p-4 rounded-xl border border-portal-card-border text-center">
            <p className="text-2xl font-semibold text-natural-100">
              {formatCurrency(
                paidInvoices.reduce((sum, inv) => sum + inv.amount, 0),
              )}
            </p>
            <p className="text-xs text-portal-note-text mt-1">
              إجمالي المبلغ المدفوع
            </p>
          </div>
          <div className="p-4 rounded-xl border border-portal-card-border text-center">
            <p className="text-2xl font-semibold text-success-600">
              {paidInvoices.length > 0 ? "%100" : "%0"}
            </p>
            <p className="text-xs text-portal-note-text mt-1">نسبة التحصيل</p>
          </div>
        </div>
      </SurfaceCard>
    </div>
  );
}
