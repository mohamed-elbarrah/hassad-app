"use client";

import { useState, useMemo } from "react";
import { CreditCard, Search, Activity, Ticket, Download, CheckCircle, Eye, Filter, Receipt, FileText, X } from "lucide-react";
import { PageIntro } from "@/components/design-system/PageIntro";
import { SurfaceCard } from "@/components/design-system/SurfaceCard";
import { DataTable } from "@/components/design-system/DataTable";
import { StatusBadge } from "@/components/design-system/StatusBadge";
import { StatCard } from "@/components/design-system/StatCard";
import { Pill } from "@/components/design-system/Pill";
import { ActionButton } from "@/components/design-system/ActionButton";
import { FormInputControl } from "@/components/design-system/FormInputControl";
import { Dialog } from "@/components/design-system/Dialog";
import { EmptyState } from "@/components/design-system/EmptyState";
import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from "@/components/design-system/Tabs";
import { toast } from "sonner";
import {
  useGetPaymentsQuery,
  useGetPaymentGatewaysQuery,
} from "@/features/finance/financeApi";
import {
  useGetAdminGatewaysHealthQuery,
} from "@/features/admin/adminApi";
import { PAYMENT_STATUS_AR, PAYMENT_METHOD_AR, TICKET_STATUS_AR } from "@hassad/shared";
import { useGetPaymentTicketsQuery, useResolvePaymentTicketMutation } from "@/features/finance/financeApi";
import { useCurrency } from "@/hooks/useCurrency";
import Link from "next/link";

const exportCSV = (data: any[], filename: string) => {
  if (!data || data.length === 0) return;
  const headers = Object.keys(data[0]);
  const csvContent = [
    headers.join(","),
    ...data.map((row) => headers.map((h) => `"${row[h] ?? ""}"`).join(",")),
  ].join("\n");
  const BOM = "\uFEFF";
  const blob = new Blob([BOM + csvContent], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${filename}.csv`;
  a.click();
  URL.revokeObjectURL(url);
};

const PAYMENT_STATUS_KEYS = ["COMPLETED", "FAILED", "PENDING", "REFUNDED"];
const PAYMENT_METHOD_KEYS = Object.keys(PAYMENT_METHOD_AR);

export default function AdminPaymentsPage() {
  const { fmtAmount, currency } = useCurrency();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [methodFilter, setMethodFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [selectedPayment, setSelectedPayment] = useState<any>(null);

  const [ticketPage, setTicketPage] = useState(1);
  const [ticketSearch, setTicketSearch] = useState("");

  const queryParams = useMemo(() => {
    const params: any = { page, limit: 20 };
    if (methodFilter) params.method = methodFilter;
    if (statusFilter) params.status = statusFilter;
    return params;
  }, [page, methodFilter, statusFilter]);

  const { data, isLoading, isError } = useGetPaymentsQuery(queryParams);
  const { data: gateways } = useGetPaymentGatewaysQuery();
  const { data: gatewaysHealth } = useGetAdminGatewaysHealthQuery();

  const { data: ticketsData, isLoading: ticketsLoading, isError: ticketsError } = useGetPaymentTicketsQuery({ page: ticketPage, limit: 20 });
  const [resolveTicket] = useResolvePaymentTicketMutation();

  const payments = data?.items ?? [];
  const filtered = search
    ? payments.filter((p: any) =>
        p.invoice?.client?.companyName?.includes(search),
      )
    : payments;

  const todayStr = new Date().toISOString().slice(0, 10);
  const todayPayments = payments.filter((p: any) =>
    p.createdAt?.startsWith(todayStr),
  );
  const todaySuccessful = todayPayments.filter(
    (p: any) => p.status === "COMPLETED" || p.status === "SUCCESS" || p.status === "SUCCESSFUL",
  );
  const todayFailed = todayPayments.filter((p: any) => p.status === "FAILED");
  const todayPending = todayPayments.filter((p: any) => p.status === "PENDING");

  const tickets = ticketsData?.items ?? [];
  const filteredTickets = ticketSearch
    ? tickets.filter(
        (t: any) =>
          t.description?.includes(ticketSearch) || t.invoiceId?.includes(ticketSearch),
      )
    : tickets;

  return (
    <div className="flex flex-col gap-6" dir="rtl">
      <PageIntro
        title="المدفوعات"
        description="جميع المدفوعات وبوابات الدفع وتذاكر الدفع"
        icon={CreditCard}
        actions={
          <button
            onClick={() => exportCSV(payments, "المدفوعات")}
            className="inline-flex items-center gap-2 rounded-xl border border-portal-divider px-4 py-2 text-sm font-medium hover:bg-badge-gray-bg transition-colors"
          >
            <Download className="size-4" />
            تصدير CSV
          </button>
        }
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="إجمالي اليوم" value={todayPayments.length} icon={CreditCard} />
        <StatCard title="ناجح اليوم" value={todaySuccessful.length} variant="success" />
        <StatCard title="فاشل اليوم" value={todayFailed.length} variant="danger" />
        <StatCard title="معلق اليوم" value={todayPending.length} variant="warning" />
      </div>

      <Tabs defaultValue="payments" dir="rtl">
        <TabsList className="w-full justify-start gap-1">
          <TabsTrigger value="payments">
            <CreditCard className="size-4 ml-1" />
            المدفوعات
          </TabsTrigger>
          <TabsTrigger value="gateways">
            <Activity className="size-4 ml-1" />
            بوابات الدفع
          </TabsTrigger>
          <TabsTrigger value="tickets">
            <Ticket className="size-4 ml-1" />
            تذاكر الدفع
          </TabsTrigger>
        </TabsList>

        <TabsContent value="payments" className="mt-4">
          <SurfaceCard>
            <div className="flex flex-wrap items-center gap-3 mb-4">
              <div className="relative max-w-sm flex-1 min-w-[200px]">
                <Search className="absolute right-3 top-1/2 -translate-y-1/2 size-4 text-portal-note-text" />
                <FormInputControl
                  placeholder="ابحث عن عميل..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pr-10"
                />
              </div>
              <div className="flex items-center gap-2">
                <Filter className="size-4 text-portal-note-text" />
                <select
                  value={methodFilter}
                  onChange={(e) => { setMethodFilter(e.target.value); setPage(1); }}
                  className="rounded-xl border border-portal-divider px-3 py-2.5 text-sm"
                >
                  <option value="">كل الطرق</option>
                  {PAYMENT_METHOD_KEYS.map((key) => (
                    <option key={key} value={key}>{PAYMENT_METHOD_AR[key]}</option>
                  ))}
                </select>
                <select
                  value={statusFilter}
                  onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
                  className="rounded-xl border border-portal-divider px-3 py-2.5 text-sm"
                >
                  <option value="">كل الحالات</option>
                  {PAYMENT_STATUS_KEYS.map((key) => (
                    <option key={key} value={key}>{PAYMENT_STATUS_AR[key]}</option>
                  ))}
                </select>
              </div>
            </div>

            <DataTable
              columns={[
                { id: "client", label: "العميل" },
                { id: "amount", label: "المبلغ" },
                { id: "method", label: "طريقة الدفع" },
                { id: "status", label: "الحالة" },
                { id: "invoice", label: "الفاتورة" },
                { id: "date", label: "التاريخ", align: "left" },
                { id: "actions", label: "", align: "left" },
              ]}
              data={filtered}
              isLoading={isLoading}
              isError={isError}
              emptyState={{
                icon: CreditCard,
                message: "لا توجد مدفوعات",
                hint: "لم يتم تسجيل أي مدفوعات بعد",
              }}
              renderRow={(p: any) => (
                <tr key={p.id} className="border-b border-portal-divider">
                  <td className="px-5 py-3 text-sm font-medium">
                    {p.invoice?.client?.companyName ?? "—"}
                  </td>
                  <td className="px-5 py-3 text-sm">
                    {fmtAmount(p.amount)} {currency.symbol}
                  </td>
                  <td className="px-5 py-3 text-sm">
                    <Pill tone="neutral">{PAYMENT_METHOD_AR[p.method] ?? p.method}</Pill>
                  </td>
                  <td className="px-5 py-3">
                    <StatusBadge
                      status={p.status}
                      label={PAYMENT_STATUS_AR[p.status] ?? p.status}
                    />
                  </td>
                  <td className="px-5 py-3 text-sm">
                    {p.invoiceId ? (
                      <Link
                        href={`/dashboard/admin/finance/invoices/${p.invoiceId}`}
                        className="text-secondary-500 hover:underline font-medium"
                      >
                        {p.invoice?.invoiceNumber ?? p.invoiceId.slice(0, 8)}
                      </Link>
                    ) : "—"}
                  </td>
                  <td className="px-5 py-3 text-sm text-portal-note-text text-left">
                    {p.createdAt?.slice(0, 10) ?? "—"}
                  </td>
                  <td className="px-5 py-3 text-left">
                    <ActionButton
                      variant="ghost"
                      size="sm"
                      onClick={() => setSelectedPayment(p)}
                    >
                      <Eye className="size-4" />
                    </ActionButton>
                  </td>
                </tr>
              )}
            />

            {data && data.totalPages > 1 && (
              <div className="flex items-center justify-between pt-4 border-t border-portal-divider mt-4">
                <span className="text-sm text-portal-note-text">
                  إجمالي {data.total} دفعة
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
        </TabsContent>

        <TabsContent value="gateways" className="mt-4">
          <SurfaceCard title="حالة بوابات الدفع">
            <div className="space-y-3">
              {(gatewaysHealth ?? gateways ?? []).map((g: any) => (
                <div
                  key={g.id ?? g.name}
                  className="flex items-center justify-between p-4 rounded-2xl border border-portal-divider"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`size-3 rounded-full ${g.isActive ? "bg-success-500" : "bg-danger-500"}`}
                    />
                    <div>
                      <p className="text-sm font-medium">
                        {g.displayName ?? g.name}
                      </p>
                      <p className="text-xs text-portal-note-text">
                        {g.type ?? "—"}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Pill tone={g.isActive ? "success" : "danger"}>
                      {g.isActive ? "نشط" : "غير نشط"}
                    </Pill>
                    {g.totalPayments !== undefined && (
                      <span className="text-xs text-portal-note-text">
                        {g.totalPayments} دفعة
                      </span>
                    )}
                  </div>
                </div>
              ))}
              {(!gateways || gateways.length === 0) &&
                (!gatewaysHealth || gatewaysHealth.length === 0) && (
                  <EmptyState icon={Activity} title="لا توجد بوابات دفع مكونة" hint="لم يتم إضافة أي بوابة دفع بعد" />
                )}
            </div>
          </SurfaceCard>
        </TabsContent>

        <TabsContent value="tickets" className="mt-4">
          <SurfaceCard>
            <div className="relative max-w-sm mb-4">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 size-4 text-portal-note-text" />
              <FormInputControl
                placeholder="ابحث عن تذكرة..."
                value={ticketSearch}
                onChange={(e) => setTicketSearch(e.target.value)}
                className="pr-10"
              />
            </div>

            <DataTable
              columns={[
                { id: "invoice", label: "الفاتورة" },
                { id: "description", label: "الوصف" },
                { id: "status", label: "الحالة" },
                { id: "createdAt", label: "تاريخ الإنشاء", align: "left" },
                { id: "actions", label: "", align: "left" },
              ]}
              data={filteredTickets}
              isLoading={ticketsLoading}
              isError={ticketsError}
              emptyState={{
                icon: Ticket,
                message: "لا توجد تذاكر دفع",
                hint: "لم يتم إنشاء أي تذاكر دفع بعد",
              }}
              renderRow={(t: any) => (
                <tr key={t.id} className="border-b border-portal-divider">
                  <td className="px-5 py-3 text-sm font-medium">
                    {t.invoiceId?.slice(0, 8) ?? "—"}
                  </td>
                  <td className="px-5 py-3 text-sm text-portal-note-text max-w-xs truncate">
                    {t.description ?? "—"}
                  </td>
                  <td className="px-5 py-3">
                    <StatusBadge
                      status={t.status}
                      label={TICKET_STATUS_AR[t.status] ?? t.status}
                    />
                  </td>
                  <td className="px-5 py-3 text-sm text-portal-note-text text-left">
                    {t.createdAt?.slice(0, 10) ?? "—"}
                  </td>
                  <td className="px-5 py-3 text-left">
                    {t.status !== "RESOLVED" && t.status !== "CLOSED" && (
                      <ActionButton
                        variant="ghost"
                        size="sm"
                        onClick={async () => {
                          try {
                            await resolveTicket(t.id).unwrap();
                            toast.success("تم حل التذكرة");
                          } catch {
                            toast.error("فشل");
                          }
                        }}
                      >
                        <CheckCircle className="size-4 ml-1" />
                        حل
                      </ActionButton>
                    )}
                  </td>
                </tr>
              )}
            />

            {ticketsData && ticketsData.total > 20 && (
              <div className="flex items-center justify-between pt-4 border-t border-portal-divider mt-4">
                <span className="text-sm text-portal-note-text">
                  إجمالي {ticketsData.total} تذكرة
                </span>
                <div className="flex gap-2">
                  <ActionButton
                    variant="outline"
                    size="sm"
                    disabled={ticketPage <= 1}
                    onClick={() => setTicketPage((p) => Math.max(1, p - 1))}
                  >
                    السابق
                  </ActionButton>
                  <ActionButton
                    variant="outline"
                    size="sm"
                    disabled={ticketsData.items.length < 20}
                    onClick={() => setTicketPage((p) => p + 1)}
                  >
                    التالي
                  </ActionButton>
                </div>
              </div>
            )}
          </SurfaceCard>
        </TabsContent>
      </Tabs>

      <Dialog
        open={!!selectedPayment}
        onOpenChange={(open) => { if (!open) setSelectedPayment(null); }}
        title="تفاصيل الدفع"
        icon={Receipt}
      >
        {selectedPayment && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-portal-note-text mb-1">المبلغ</p>
                <p className="text-lg font-bold">{fmtAmount(selectedPayment.amount)} {currency.symbol}</p>
              </div>
              <div>
                <p className="text-xs text-portal-note-text mb-1">الحالة</p>
                <StatusBadge
                  status={selectedPayment.status}
                  label={PAYMENT_STATUS_AR[selectedPayment.status] ?? selectedPayment.status}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-portal-note-text mb-1">طريقة الدفع</p>
                <Pill tone="neutral">{PAYMENT_METHOD_AR[selectedPayment.method] ?? selectedPayment.method}</Pill>
              </div>
              <div>
                <p className="text-xs text-portal-note-text mb-1">العميل</p>
                <p className="text-sm font-medium">{selectedPayment.invoice?.client?.companyName ?? "—"}</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-portal-note-text mb-1">الفاتورة</p>
                <p className="text-sm">{selectedPayment.invoice?.invoiceNumber ?? selectedPayment.invoiceId?.slice(0, 8) ?? "—"}</p>
              </div>
              <div>
                <p className="text-xs text-portal-note-text mb-1">التاريخ</p>
                <p className="text-sm">{selectedPayment.createdAt?.slice(0, 10) ?? "—"}</p>
              </div>
            </div>
            {selectedPayment.providerPaymentId && (
              <div>
                <p className="text-xs text-portal-note-text mb-1">رقم عملية المزود</p>
                <p className="text-sm font-mono text-left" dir="ltr">{selectedPayment.providerPaymentId}</p>
              </div>
            )}
            {selectedPayment.notes && (
              <div>
                <p className="text-xs text-portal-note-text mb-1">ملاحظات</p>
                <p className="text-sm">{selectedPayment.notes}</p>
              </div>
            )}
          </div>
        )}
      </Dialog>
    </div>
  );
}
