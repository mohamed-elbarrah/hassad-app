"use client";

import { useState, useMemo } from "react";
import { FileText, Search, Ban, Download, Building2, Calendar, DollarSign, User, Phone, Mail, Eye, X } from "lucide-react";
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
  useGetAdminClientsQuery,
} from "@/features/admin/adminApi";
import { INVOICE_STATUS_AR } from "@hassad/shared";
import { useCurrency } from "@/hooks/useCurrency";

export default function AdminInvoicesPage() {
  const { fmtAmount, currency } = useCurrency();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [clientFilter, setClientFilter] = useState("");
  const [selectedInvoice, setSelectedInvoice] = useState<any>(null);
  const [showDetail, setShowDetail] = useState(false);

  // Dialogs
  const [showForceStatus, setShowForceStatus] = useState(false);
  const [forceStatusValue, setForceStatusValue] = useState("");
  const [forceReason, setForceReason] = useState("");

  const [showWriteOff, setShowWriteOff] = useState(false);
  const [writeOffReason, setWriteOffReason] = useState("");

  const [showRefund, setShowRefund] = useState(false);
  const [refundAmount, setRefundAmount] = useState(0);
  const [refundReason, setRefundReason] = useState("");

  const { data: clientsData } = useGetAdminClientsQuery({ limit: 200 });
  const { data, isLoading, isError } = useGetInvoicesQuery({
    page,
    limit: 20,
    clientId: clientFilter || undefined,
  });
  const [forceStatus] = useForceAdminInvoiceStatusMutation();
  const [writeOff] = useWriteOffAdminInvoiceMutation();
  const [triggerRefund] = useTriggerAdminRefundMutation();

  const invoices = data?.items ?? [];
  const filtered = invoices.filter((inv: any) => {
    if (search && !inv.client?.companyName?.includes(search)) return false;
    if (statusFilter && inv.status !== statusFilter) return false;
    return true;
  });

  const totalPaid = useMemo(() => data?.total
    ? filtered.filter((i: any) => i.status === "PAID").reduce((s: number, i: any) => s + i.amount, 0)
    : 0, [filtered, data]);

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
        <div className="flex items-center gap-3 mb-4 flex-wrap">
          <div className="relative flex-1 max-w-sm min-w-[200px]">
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
          <select
            value={clientFilter}
            onChange={(e) => setClientFilter(e.target.value)}
            className="rounded-xl border border-portal-divider px-3 py-2 text-sm"
          >
            <option value="">كل العملاء</option>
            {(clientsData?.items ?? []).map((c: any) => (
              <option key={c.id} value={c.id}>
                {c.companyName ?? c.contactName ?? "—"}
              </option>
            ))}
          </select>
        </div>

        <DataTable
          columns={[
            { id: "client", label: "العميل" },
            { id: "amount", label: "المبلغ" },
            { id: "status", label: "الحالة" },
            { id: "issueDate", label: "تاريخ الإصدار", align: "left" },
            { id: "dueDate", label: "تاريخ الاستحقاق", align: "left" },
            { id: "remaining", label: "المبلغ المتبقي" },
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
          renderRow={(inv: any) => {
            const remaining = inv.amount - (inv.payments ?? []).reduce((s: number, p: any) => s + (p.amount ?? 0), 0);
            return <tr
              key={inv.id}
              className="border-b border-portal-divider cursor-pointer hover:bg-badge-gray-bg/50"
              onClick={() => {
                setSelectedInvoice(inv);
                setShowDetail(true);
              }}
            >
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
                {inv.issueDate?.slice(0, 10) ?? "—"}
              </td>
              <td className="px-5 py-3 text-sm text-portal-note-text text-left">
                {inv.dueDate?.slice(0, 10) ?? "—"}
              </td>
              <td className="px-5 py-3 text-sm">
                <span className={remaining > 0 ? "text-[#E10000]" : "text-green-600"}>
                  {remaining > 0 ? fmtAmount(remaining) : "مدفوعة بالكامل"} {remaining > 0 ? currency.symbol : ""}
                </span>
              </td>
              <td className="px-5 py-3 text-left" onClick={(e) => e.stopPropagation()}>
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
            </tr>;
          }}
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

      {/* Invoice Detail Dialog */}
      <Dialog
        open={showDetail}
        onOpenChange={(o) => {
          if (!o) setShowDetail(false);
        }}
        title={`فاتورة #${selectedInvoice?.invoiceNumber ?? ""}`}
        description={selectedInvoice?.client?.companyName ?? ""}
        footer={
          <div className="flex gap-2 justify-end">
            <ActionButton
              variant="outline"
              onClick={() => setShowDetail(false)}
            >
              إغلاق
            </ActionButton>
          </div>
        }
      >
        {selectedInvoice && (
          <div className="space-y-5" dir="rtl">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <span className="text-xs text-portal-note-text">رقم الفاتورة</span>
                <p className="text-sm font-medium mt-0.5">
                  {selectedInvoice.invoiceNumber ?? "—"}
                </p>
              </div>
              <div>
                <span className="text-xs text-portal-note-text">الحالة</span>
                <div className="mt-0.5">
                  <StatusBadge
                    status={selectedInvoice.status}
                    label={INVOICE_STATUS_AR[selectedInvoice.status] ?? selectedInvoice.status}
                  />
                </div>
              </div>
              <div>
                <span className="text-xs text-portal-note-text">المبلغ</span>
                <p className="text-sm font-medium mt-0.5">
                  {fmtAmount(selectedInvoice.amount)} {currency.symbol}
                </p>
              </div>
              <div>
                <span className="text-xs text-portal-note-text">طريقة الدفع</span>
                <p className="text-sm font-medium mt-0.5">
                  {selectedInvoice.paymentMethod ?? "—"}
                </p>
              </div>
              <div>
                <span className="text-xs text-portal-note-text">تاريخ الإصدار</span>
                <p className="text-sm font-medium mt-0.5">
                  {selectedInvoice.issueDate?.slice(0, 10) ?? "—"}
                </p>
              </div>
              <div>
                <span className="text-xs text-portal-note-text">تاريخ الاستحقاق</span>
                <p className="text-sm font-medium mt-0.5">
                  {selectedInvoice.dueDate?.slice(0, 10) ?? "—"}
                </p>
              </div>
              {selectedInvoice.paidAt && (
                <div>
                  <span className="text-xs text-portal-note-text">تاريخ الدفع</span>
                  <p className="text-sm font-medium mt-0.5">
                    {selectedInvoice.paidAt?.slice(0, 10) ?? "—"}
                  </p>
                </div>
              )}
              {selectedInvoice.sentAt && (
                <div>
                  <span className="text-xs text-portal-note-text">تاريخ الإرسال</span>
                  <p className="text-sm font-medium mt-0.5">
                    {selectedInvoice.sentAt?.slice(0, 10) ?? "—"}
                  </p>
                </div>
              )}
            </div>
            <div className="border-t border-portal-divider pt-4">
              <h4 className="text-sm font-medium text-portal-note-text mb-3">معلومات العميل</h4>
              <div className="grid grid-cols-2 gap-3">
                <div className="flex items-center gap-2">
                  <Building2 className="size-3.5 text-portal-icon" />
                  <div>
                    <span className="text-xs text-portal-note-text">الشركة</span>
                    <p className="text-sm">{selectedInvoice.client?.companyName ?? "—"}</p>
                  </div>
                </div>
                {selectedInvoice.client?.user?.name && (
                  <div className="flex items-center gap-2">
                    <User className="size-3.5 text-portal-icon" />
                    <div>
                      <span className="text-xs text-portal-note-text">جهة الاتصال</span>
                      <p className="text-sm">{selectedInvoice.client.user.name}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
            {selectedInvoice.notes && (
              <div className="border-t border-portal-divider pt-4">
                <span className="text-xs text-portal-note-text">ملاحظات</span>
                <p className="text-sm mt-1">{selectedInvoice.notes}</p>
              </div>
            )}
            {selectedInvoice.payments?.length > 0 && (
              <div className="border-t border-portal-divider pt-4">
                <h4 className="text-sm font-medium text-portal-note-text mb-2">المدفوعات</h4>
                <div className="space-y-2">
                  {selectedInvoice.payments.map((p: any) => (
                    <div key={p.id} className="flex items-center justify-between text-sm">
                      <span>{p.method ?? "—"}</span>
                      <span className="font-medium">{fmtAmount(p.amount)} {currency.symbol}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </Dialog>

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
