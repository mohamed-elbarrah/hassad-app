"use client";

import { useState } from "react";
import Link from "next/link";
import { Banknote } from "lucide-react";
import { PageIntro } from "@/components/design-system/PageIntro";
import { SurfaceCard } from "@/components/design-system/SurfaceCard";
import { AdminStatusBadge } from "@/components/dashboard/admin/shared/AdminStatusBadge";
import { AdminEmptyState } from "@/components/dashboard/admin/shared/AdminEmptyState";
import { useGetAdminPaymentsQuery } from "@/features/admin/adminFinanceApi";

const fmtCurrency = (n: number) =>
  new Intl.NumberFormat("ar-SA", {
    style: "currency",
    currency: "SAR",
    minimumFractionDigits: 0,
  }).format(n);

const STATUS_OPTIONS = [
  { value: "", label: "الكل" },
  { value: "SUCCESS", label: "ناجح" },
  { value: "FAILED", label: "فاشل" },
  { value: "PENDING", label: "قيد الانتظار" },
  { value: "REFUNDED", label: "مسترجع" },
];

const METHOD_OPTIONS = [
  { value: "", label: "جميع الطرق" },
  { value: "stripe", label: "Stripe" },
  { value: "bank_transfer", label: "تحويل بنكي" },
];

export default function AdminFinancePaymentsPage() {
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState("");
  const [methodFilter, setMethodFilter] = useState("");

  const { data, isLoading, isError } = useGetAdminPaymentsQuery({
    status: statusFilter || undefined,
    method: methodFilter || undefined,
    page,
    limit: 20,
  });

  if (isError) {
    return (
      <div className="page-shell" dir="rtl">
        <AdminEmptyState
          icon={Banknote}
          title="حدث خطأ أثناء تحميل المدفوعات"
          description="يرجى تحديث الصفحة والمحاولة مرة أخرى."
        />
      </div>
    );
  }

  return (
    <div className="page-shell" dir="rtl">
      <PageIntro
        title="المدفوعات"
        description="إدارة جميع المدفوعات والمعاملات المالية"
        icon={Banknote}
      />

      <SurfaceCard>
        <div className="flex items-center gap-3 mb-4">
          <select
            className="rounded-xl border border-portal-card-border px-4 py-2 text-sm"
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
          >
            {STATUS_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
          <select
            className="rounded-xl border border-portal-card-border px-4 py-2 text-sm"
            value={methodFilter}
            onChange={(e) => {
              setMethodFilter(e.target.value);
              setPage(1);
            }}
          >
            {METHOD_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <div
                key={i}
                className="h-16 animate-pulse rounded-xl bg-portal-card-border"
              />
            ))}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-portal-divider">
                  <th className="py-3 px-2 text-right text-xs font-medium text-portal-note-text">المبلغ</th>
                  <th className="py-3 px-2 text-right text-xs font-medium text-portal-note-text">طريقة الدفع</th>
                  <th className="py-3 px-2 text-right text-xs font-medium text-portal-note-text">الحالة</th>
                  <th className="py-3 px-2 text-right text-xs font-medium text-portal-note-text">رقم الفاتورة</th>
                  <th className="py-3 px-2 text-right text-xs font-medium text-portal-note-text">التاريخ</th>
                </tr>
              </thead>
              <tbody>
                {(data?.items ?? []).length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-12 text-center text-sm text-portal-note-text">
                      لا توجد مدفوعات
                    </td>
                  </tr>
                ) : (
                  (data?.items ?? []).map((pmt) => (
                    <tr key={pmt.id} className="border-b border-portal-divider hover:bg-portal-divider/20">
                      <td className="py-3 px-2 text-right text-sm font-medium text-natural-100">
                        {fmtCurrency(pmt.amount)}
                      </td>
                      <td className="py-3 px-2 text-right text-sm text-portal-note-text">
                        {pmt.method}
                      </td>
                      <td className="py-3 px-2 text-right">
                        <AdminStatusBadge domain="payment" status={pmt.status} />
                      </td>
                      <td className="py-3 px-2 text-right">
                        {pmt.invoiceId ? (
                          <Link
                            href={`/dashboard/admin/finance/invoices/${pmt.invoiceId}`}
                            className="text-sm text-secondary-500 hover:underline"
                          >
                            {pmt.invoiceNumber || "—"}
                          </Link>
                        ) : (
                          <span className="text-sm text-portal-note-text">—</span>
                        )}
                      </td>
                      <td className="py-3 px-2 text-right text-sm text-portal-note-text">
                        {new Date(pmt.createdAt).toLocaleDateString("ar-SA")}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {data && data.totalPages > 1 && (
          <div className="flex items-center justify-between mt-4 pt-4 border-t border-portal-divider">
            <p className="text-xs text-portal-note-text">
              الصفحة {data.page} من {data.totalPages} · إجمالي {data.total}
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="px-3 py-1.5 text-sm rounded-xl border border-portal-card-border disabled:opacity-40"
              >
                السابق
              </button>
              <button
                onClick={() => setPage((p) => p + 1)}
                disabled={page >= (data?.totalPages ?? 1)}
                className="px-3 py-1.5 text-sm rounded-xl border border-portal-card-border disabled:opacity-40"
              >
                التالي
              </button>
            </div>
          </div>
        )}
      </SurfaceCard>
    </div>
  );
}
