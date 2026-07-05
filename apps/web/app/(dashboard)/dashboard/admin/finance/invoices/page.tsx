"use client";

import { useState } from "react";
import { FileText, Search, Ban, Download } from "lucide-react";
import { PageIntro } from "@/components/design-system/PageIntro";
import { SurfaceCard } from "@/components/design-system/SurfaceCard";
import { DataTable } from "@/components/design-system/DataTable";
import { StatusBadge } from "@/components/design-system/StatusBadge";
import { StatCard } from "@/components/design-system/StatCard";
import { ActionButton } from "@/components/design-system/ActionButton";
import { FormInputControl } from "@/components/design-system/FormInputControl";
import { Dialog } from "@/components/design-system/Dialog";
import { toast } from "sonner";
import { useGetInvoicesQuery } from "@/features/finance/financeApi";
import {
  useForceAdminInvoiceStatusMutation,
  useWriteOffAdminInvoiceMutation,
  useTriggerAdminRefundMutation,
} from "@/features/admin/adminApi";
import { INVOICE_STATUS_AR } from "@hassad/shared";
import { useCurrency } from "@/hooks/useCurrency";

export default function AdminInvoicesPage() {
  const { fmtAmount, currency } = useCurrency();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [selectedInvoice, setSelectedInvoice] = useState<any>(null);

  // Dialogs
  const [showForceStatus, setShowForceStatus] = useState(false);
  const [forceStatusValue, setForceStatusValue] = useState("");
  const [forceReason, setForceReason] = useState("");

  const [showWriteOff, setShowWriteOff] = useState(false);
  const [writeOffReason, setWriteOffReason] = useState("");

  const [showRefund, setShowRefund] = useState(false);
  const [refundAmount, setRefundAmount] = useState(0);
  const [refundReason, setRefundReason] = useState("");

  const { data, isLoading, isError } = useGetInvoicesQuery({ page, limit: 20 });
  const [forceStatus] = useForceAdminInvoiceStatusMutation();
  const [writeOff] = useWriteOffAdminInvoiceMutation();
  const [triggerRefund] = useTriggerAdminRefundMutation();

  const invoices = data?.items ?? [];
  const filtered = invoices.filter((inv: any) => {
    if (search && !inv.client?.companyName?.includes(search)) return false;
    if (statusFilter && inv.status !== statusFilter) return false;
    return true;
  });

  const handleExport = () => {
    const csv = [
      ["العميل", "المبلغ", "الحالة", "تاريخ الاستحقاق", "تاريخ الإنشاء"].join(
        ",",
      ),
      ...filtered.map((inv: any) =>
        [
          inv.client?.companyName ?? "",
          inv.amount ?? "",
          inv.status,
          inv.dueDate?.slice(0, 10) ?? "",
          inv.createdAt?.slice(0, 10) ?? "",
        ].join(","),
      ),
    ].join("\n");
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `invoices-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("تم تصدير الفواتير");
  };

  return (
    <div className="flex flex-col gap-6" dir="rtl">
      <PageIntro
        title="الفواتير"
        description="إدارة جميع فواتير المنصة"
        icon={FileText}
        actions={
          <ActionButton variant="outline" size="md" onClick={handleExport}>
            <Download className="size-4 ml-1" />
            تصدير CSV
          </ActionButton>
        }
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="إجمالي الفواتير" value={data?.total ?? 0} icon={FileText} />
        <StatCard title="مدفوعة" value={invoices.filter((i: any) => i.status === "PAID").length} variant="success" />
        <StatCard title="معلقة" value={invoices.filter((i: any) => i.status === "PENDING" || i.status === "PARTIAL").length} variant="warning" />
        <StatCard title="متأخرة" value={invoices.filter((i: any) => i.status === "OVERDUE").length} variant="danger" />
      </div>

      <SurfaceCard>
        <div className="flex items-center gap-3 mb-4">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 size-4 text-portal-note-text" />
            <FormInputControl
              placeholder="ابحث عن فاتورة..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pr-10"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-xl border border-portal-divider px-3 py-2 text-sm"
          >
            <option value="">كل الحالات</option>
            {Object.entries(INVOICE_STATUS_AR).map(([k, v]) => (
              <option key={k} value={k}>
                {v}
              </option>
            ))}
          </select>
        </div>

        <DataTable
          columns={[
            { id: "client", label: "العميل" },
            { id: "amount", label: "المبلغ" },
            { id: "status", label: "الحالة" },
            { id: "dueDate", label: "تاريخ الاستحقاق", align: "left" },
            { id: "actions", label: "الإجراءات", align: "left" },
          ]}
          data={filtered}
          isLoading={isLoading}
          isError={isError}
          emptyState={{
            icon: FileText,
            message: "لا توجد فواتير",
            hint: "لم يتم إنشاء أي فواتير بعد",
          }}
          renderRow={(inv: any) => (
            <tr key={inv.id} className="border-b border-portal-divider">
              <td className="px-5 py-3 text-sm font-medium">
                {inv.client?.companyName ?? "—"}
              </td>
              <td className="px-5 py-3 text-sm">
                {fmtAmount(inv.amount)} {currency.symbol}
              </td>
              <td className="px-5 py-3">
                <StatusBadge
                  status={inv.status}
                  label={INVOICE_STATUS_AR[inv.status] ?? inv.status}
                />
              </td>
              <td className="px-5 py-3 text-sm text-portal-note-text text-left">
                {inv.dueDate?.slice(0, 10) ?? "—"}
              </td>
              <td className="px-5 py-3 text-left">
                <div className="flex gap-1 justify-end">
                  <ActionButton
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setSelectedInvoice(inv);
                      setShowForceStatus(true);
                    }}
                  >
                    تغيير الحالة
                  </ActionButton>
                  {inv.status !== "CANCELLED" && (
                    <ActionButton
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setSelectedInvoice(inv);
                        setShowWriteOff(true);
                      }}
                    >
                      <Ban className="size-4" />
                    </ActionButton>
                  )}
                  {(inv.status === "PAID" || inv.status === "PARTIAL") && (
                    <ActionButton
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setSelectedInvoice(inv);
                        setRefundAmount(inv.amount);
                        setShowRefund(true);
                      }}
                    >
                      استرداد
                    </ActionButton>
                  )}
                </div>
              </td>
            </tr>
          )}
        />

        {data && data.totalPages > 1 && (
          <div className="flex items-center justify-between pt-4 border-t border-portal-divider mt-4">
            <span className="text-sm text-portal-note-text">
              إجمالي {data.total} فاتورة
            </span>
            <div className="flex gap-2">
              <ActionButton
                variant="outline"
                size="sm"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                السابق
              </ActionButton>
              <ActionButton
                variant="outline"
                size="sm"
                disabled={page >= data.totalPages}
                onClick={() => setPage((p) => p + 1)}
              >
                التالي
              </ActionButton>
            </div>
          </div>
        )}
      </SurfaceCard>

      {/* Force Status Dialog */}
      <Dialog
        open={showForceStatus}
        onOpenChange={setShowForceStatus}
        title="تغيير حالة الفاتورة"
        footer={
          <div className="flex gap-2 justify-end">
            <ActionButton
              variant="outline"
              onClick={() => setShowForceStatus(false)}
            >
              إلغاء
            </ActionButton>
            <ActionButton
              onClick={async () => {
                if (!forceStatusValue || !forceReason) {
                  toast.error("يرجى اختيار الحالة وكتابة السبب");
                  return;
                }
                try {
                  await forceStatus({
                    id: selectedInvoice.id,
                    status: forceStatusValue,
                    reason: forceReason,
                  }).unwrap();
                  toast.success("تم تغيير حالة الفاتورة");
                  setShowForceStatus(false);
                } catch {
                  toast.error("فشل تغيير الحالة");
                }
              }}
            >
              تأكيد
            </ActionButton>
          </div>
        }
      >
        <div className="space-y-4">
          <p className="text-sm text-portal-note-text">
            الفاتورة:             {selectedInvoice?.client?.companyName} —{" "}
            {fmtAmount(selectedInvoice?.amount)} {currency.symbol}
          </p>
          <select
            value={forceStatusValue}
            onChange={(e) => setForceStatusValue(e.target.value)}
            className="w-full rounded-xl border border-portal-divider px-4 py-2.5 text-sm"
          >
            <option value="">اختر الحالة...</option>
            {Object.entries(INVOICE_STATUS_AR).map(([k, v]) => (
              <option key={k} value={k}>
                {v}
              </option>
            ))}
          </select>
          <FormInputControl
            placeholder="سبب تغيير الحالة..."
            value={forceReason}
            onChange={(e) => setForceReason(e.target.value)}
          />
        </div>
      </Dialog>

      {/* Write-off Dialog */}
      <Dialog
        open={showWriteOff}
        onOpenChange={setShowWriteOff}
        title="شطب الفاتورة"
        footer={
          <div className="flex gap-2 justify-end">
            <ActionButton
              variant="outline"
              onClick={() => setShowWriteOff(false)}
            >
              إلغاء
            </ActionButton>
            <ActionButton
              variant="primary"
              onClick={async () => {
                if (!writeOffReason) {
                  toast.error("يرجى كتابة سبب الشطب");
                  return;
                }
                try {
                  await writeOff({
                    id: selectedInvoice.id,
                    reason: writeOffReason,
                  }).unwrap();
                  toast.success("تم شطب الفاتورة");
                  setShowWriteOff(false);
                } catch {
                  toast.error("فشل شطب الفاتورة");
                }
              }}
            >
              تأكيد الشطب
            </ActionButton>
          </div>
        }
      >
        <div className="space-y-4">
          <p className="text-sm text-portal-note-text">
            الفاتورة:             {selectedInvoice?.client?.companyName} —{" "}
            {fmtAmount(selectedInvoice?.amount)} {currency.symbol}
          </p>
          <div className="rounded-2xl bg-danger-50 p-3 text-sm text-danger-700">
            <Ban className="size-4 inline ml-1" />
            سيتم إلغاء هذه الفاتورة ولن تكون قابلة للتحصيل
          </div>
          <FormInputControl
            placeholder="سبب الشطب..."
            value={writeOffReason}
            onChange={(e) => setWriteOffReason(e.target.value)}
          />
        </div>
      </Dialog>

      {/* Refund Dialog */}
      <Dialog
        open={showRefund}
        onOpenChange={setShowRefund}
        title="استرداد المبلغ"
        footer={
          <div className="flex gap-2 justify-end">
            <ActionButton
              variant="outline"
              onClick={() => setShowRefund(false)}
            >
              إلغاء
            </ActionButton>
            <ActionButton
              onClick={async () => {
                if (!refundReason || !refundAmount) {
                  toast.error("يرجى إدخال المبلغ والسبب");
                  return;
                }
                try {
                  await triggerRefund({
                    id: selectedInvoice.id,
                    amount: refundAmount,
                    reason: refundReason,
                  }).unwrap();
                  toast.success("تم إنشاء طلب استرداد");
                  setShowRefund(false);
                } catch {
                  toast.error("فشل إنشاء طلب الاسترداد");
                }
              }}
            >
              تأكيد الاسترداد
            </ActionButton>
          </div>
        }
      >
        <div className="space-y-4">
          <p className="text-sm text-portal-note-text">
            الفاتورة:             {selectedInvoice?.client?.companyName} —{" "}
            {fmtAmount(selectedInvoice?.amount)} {currency.symbol}
          </p>
          <div>
            <label className="block text-sm text-portal-note-text mb-1">
              المبلغ المسترد
            </label>
            <FormInputControl
              type="number"
              value={refundAmount}
              onChange={(e) => setRefundAmount(Number(e.target.value))}
            />
          </div>
          <FormInputControl
            placeholder="سبب الاسترداد..."
            value={refundReason}
            onChange={(e) => setRefundReason(e.target.value)}
          />
        </div>
      </Dialog>
    </div>
  );
}
