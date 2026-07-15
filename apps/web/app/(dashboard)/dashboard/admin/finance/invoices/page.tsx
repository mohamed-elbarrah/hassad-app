"use client";

import { useState } from "react";
import Link from "next/link";
import { FileText, Search } from "lucide-react";
import { PageIntro } from "@/components/design-system/PageIntro";
import { SurfaceCard } from "@/components/design-system/SurfaceCard";
import { AdminStatusBadge } from "@/components/dashboard/admin/shared/AdminStatusBadge";
import { AdminEmptyState } from "@/components/dashboard/admin/shared/AdminEmptyState";
import {
  useGetAdminInvoicesQuery,
  useForceInvoiceStatusMutation,
  useWriteOffInvoiceMutation,
  useRefundInvoiceMutation,
} from "@/features/admin/adminFinanceApi";

const fmtCurrency = (n: number) =>
  new Intl.NumberFormat("ar-SA", {
    style: "currency",
    currency: "SAR",
    minimumFractionDigits: 0,
  }).format(n);

const STATUS_OPTIONS = [
  { value: "", label: "الكل" },
  { value: "PENDING", label: "قيد الانتظار" },
  { value: "PAID", label: "مدفوع" },
  { value: "LATE", label: "متأخر" },
  { value: "VOID", label: "ملغي" },
  { value: "PARTIAL", label: "مدفوع جزئياً" },
];

function ConfirmModal({
  open,
  title,
  description,
  confirmLabel,
  confirmVariant,
  onConfirm,
  onCancel,
}: {
  open: boolean;
  title: string;
  description: string;
  confirmLabel: string;
  confirmVariant?: "danger" | "warning" | "primary";
  onConfirm: (reason: string) => void;
  onCancel: () => void;
}) {
  const [reason, setReason] = useState("");
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl" dir="rtl">
        <h3 className="text-lg font-semibold text-natural-100 mb-2">{title}</h3>
        <p className="text-sm text-portal-note-text mb-4">{description}</p>
        <textarea
          className="w-full rounded-xl border border-portal-card-border p-3 text-sm resize-none h-24"
          placeholder="سبب الإجراء (مطلوب)"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
        />
        <div className="flex items-center gap-3 mt-4">
          <button
            onClick={() => reason.trim() && onConfirm(reason.trim())}
            disabled={!reason.trim()}
            className={`flex-1 rounded-xl py-2.5 text-sm font-medium text-white disabled:opacity-50 ${
              confirmVariant === "danger"
                ? "bg-danger-500 hover:bg-danger-600"
                : confirmVariant === "warning"
                  ? "bg-warning-500 hover:bg-warning-600"
                  : "bg-secondary-500 hover:bg-secondary-600"
            }`}
          >
            {confirmLabel}
          </button>
          <button
            onClick={onCancel}
            className="flex-1 rounded-xl py-2.5 text-sm font-medium border border-portal-card-border text-portal-note-text hover:text-natural-100"
          >
            إلغاء
          </button>
        </div>
      </div>
    </div>
  );
}

export default function AdminFinanceInvoicesPage() {
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState("");
  const [search, setSearch] = useState("");
  const [actionTarget, setActionTarget] = useState<{
    id: string;
    type: "force-status" | "write-off" | "refund";
    status?: string;
  } | null>(null);

  const { data, isLoading, isError } = useGetAdminInvoicesQuery({
    status: statusFilter || undefined,
    page,
    limit: 20,
  });

  const [forceStatus] = useForceInvoiceStatusMutation();
  const [writeOff] = useWriteOffInvoiceMutation();
  const [refund] = useRefundInvoiceMutation();

  const handleConfirmAction = async (reason: string) => {
    if (!actionTarget) return;
    try {
      if (actionTarget.type === "force-status") {
        await forceStatus({ id: actionTarget.id, status: actionTarget.status!, reason }).unwrap();
      } else if (actionTarget.type === "write-off") {
        await writeOff({ id: actionTarget.id, reason }).unwrap();
      } else if (actionTarget.type === "refund") {
        await refund({ id: actionTarget.id, reason }).unwrap();
      }
    } catch {
      /* handled by RTK */
    }
    setActionTarget(null);
  };

  if (isError) {
    return (
      <div className="flex flex-col gap-5" dir="rtl">
        <AdminEmptyState
          icon={FileText}
          title="حدث خطأ أثناء تحميل الفواتير"
          description="يرجى تحديث الصفحة والمحاولة مرة أخرى."
        />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5" dir="rtl">
      <PageIntro
        title="الفواتير"
        description="إدارة جميع الفواتير المالية"
        icon={FileText}
      />

      <SurfaceCard>
        <div className="flex items-center gap-3 mb-4">
          <div className="relative flex-1 max-w-xs">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-portal-note-text" />
            <input
              className="w-full rounded-xl border border-portal-card-border pr-10 pl-4 py-2 text-sm"
              placeholder="بحث..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
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
                  <th className="py-3 px-2 text-right text-xs font-medium text-portal-note-text">رقم الفاتورة</th>
                  <th className="py-3 px-2 text-right text-xs font-medium text-portal-note-text">العميل</th>
                  <th className="py-3 px-2 text-right text-xs font-medium text-portal-note-text">المبلغ</th>
                  <th className="py-3 px-2 text-right text-xs font-medium text-portal-note-text">المتبقي</th>
                  <th className="py-3 px-2 text-right text-xs font-medium text-portal-note-text">الحالة</th>
                  <th className="py-3 px-2 text-right text-xs font-medium text-portal-note-text">تاريخ الاستحقاق</th>
                  <th className="py-3 px-2 text-right text-xs font-medium text-portal-note-text">إجراءات</th>
                </tr>
              </thead>
              <tbody>
                {(data?.items ?? []).length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-sm text-portal-note-text">
                      لا توجد فواتير
                    </td>
                  </tr>
                ) : (
                  (data?.items ?? []).map((inv) => (
                    <tr key={inv.id} className="border-b border-portal-divider hover:bg-portal-divider/20">
                      <td className="py-3 px-2 text-right">
                        <Link
                          href={`/dashboard/admin/finance/invoices/${inv.id}`}
                          className="text-sm font-medium text-secondary-500 hover:underline"
                        >
                          {inv.invoiceNumber}
                        </Link>
                      </td>
                      <td className="py-3 px-2 text-right text-sm text-portal-note-text">
                        {inv.clientName || "—"}
                      </td>
                      <td className="py-3 px-2 text-right text-sm font-medium text-natural-100">
                        {fmtCurrency(inv.amount)}
                      </td>
                      <td className="py-3 px-2 text-right text-sm text-portal-note-text">
                        {inv.remainingAmount > 0 ? fmtCurrency(inv.remainingAmount) : "—"}
                      </td>
                      <td className="py-3 px-2 text-right">
                        <AdminStatusBadge domain="invoice" status={inv.status} />
                      </td>
                      <td className="py-3 px-2 text-right text-sm text-portal-note-text">
                        {inv.dueDate
                          ? new Date(inv.dueDate).toLocaleDateString("ar-SA")
                          : "—"}
                      </td>
                      <td className="py-3 px-2 text-right">
                        <div className="flex items-center gap-1">
                          {inv.status !== "PAID" && inv.status !== "VOID" && (
                            <>
                              <button
                                onClick={() =>
                                  setActionTarget({
                                    id: inv.id,
                                    type: "force-status",
                                    status: "PAID",
                                  })
                                }
                                className="text-xs px-2 py-1 rounded-lg bg-success-100 text-success-700 hover:bg-success-200"
                              >
                                تأكيد الدفع
                              </button>
                              <button
                                onClick={() =>
                                  setActionTarget({
                                    id: inv.id,
                                    type: "write-off",
                                  })
                                }
                                className="text-xs px-2 py-1 rounded-lg bg-warning-100 text-warning-700 hover:bg-warning-200"
                              >
                                شطب
                              </button>
                            </>
                          )}
                          {inv.status === "PAID" && (
                            <button
                              onClick={() =>
                                setActionTarget({ id: inv.id, type: "refund" })
                              }
                              className="text-xs px-2 py-1 rounded-lg bg-danger-100 text-danger-700 hover:bg-danger-200"
                            >
                              استرداد
                            </button>
                          )}
                          <Link
                            href={`/dashboard/admin/finance/invoices/${inv.id}`}
                            className="text-xs px-2 py-1 rounded-lg bg-portal-divider text-portal-note-text hover:text-natural-100"
                          >
                            عرض
                          </Link>
                        </div>
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

      <ConfirmModal
        open={actionTarget?.type === "force-status"}
        title="تأكيد الدفع"
        description="سيتم تغيير حالة الفاتورة إلى مدفوعة. هذا الإجراء يسجل في سجل التدقيق."
        confirmLabel="تأكيد الدفع"
        confirmVariant="primary"
        onConfirm={handleConfirmAction}
        onCancel={() => setActionTarget(null)}
      />

      <ConfirmModal
        open={actionTarget?.type === "write-off"}
        title="شطب الفاتورة"
        description="سيتم إلغاء الفاتورة وشطبها. لا يمكن التراجع عن هذا الإجراء."
        confirmLabel="شطب الفاتورة"
        confirmVariant="warning"
        onConfirm={handleConfirmAction}
        onCancel={() => setActionTarget(null)}
      />

      <ConfirmModal
        open={actionTarget?.type === "refund"}
        title="استرداد المبلغ"
        description="سيتم إنشاء طلب استرداد للمبلغ. هذا الإجراء يسجل في سجل التدقيق."
        confirmLabel="استرداد"
        confirmVariant="danger"
        onConfirm={handleConfirmAction}
        onCancel={() => setActionTarget(null)}
      />
    </div>
  );
}
