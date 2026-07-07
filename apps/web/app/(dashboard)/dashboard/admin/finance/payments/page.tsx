"use client";

import { useState } from "react";
import { CreditCard, Search, Activity, Webhook, RefreshCw, Ticket, Download, CheckCircle } from "lucide-react";
import { PageIntro } from "@/components/design-system/PageIntro";
import { SurfaceCard } from "@/components/design-system/SurfaceCard";
import { DataTable } from "@/components/design-system/DataTable";
import { StatusBadge } from "@/components/design-system/StatusBadge";
import { StatCard } from "@/components/design-system/StatCard";
import { Pill } from "@/components/design-system/Pill";
import { ActionButton } from "@/components/design-system/ActionButton";
import { FormInputControl } from "@/components/design-system/FormInputControl";
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
  useGetAdminWebhookLogsQuery,
  useRetryAdminWebhookMutation,
  useGetAdminGatewaysHealthQuery,
} from "@/features/admin/adminApi";
import { PAYMENT_STATUS_AR, TICKET_STATUS_AR } from "@hassad/shared";
import { useGetPaymentTicketsQuery, useResolvePaymentTicketMutation } from "@/features/finance/financeApi";
import { useCurrency } from "@/hooks/useCurrency";

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

// الصفحة الموحدة للمدفوعات (تم دمجها من /admin/payments و /admin/finance/payments)
export default function AdminPaymentsPage() {
  const { fmtAmount, currency } = useCurrency();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [webhookFilter, setWebhookFilter] = useState("");

  const [ticketPage, setTicketPage] = useState(1);
  const [ticketSearch, setTicketSearch] = useState("");

  const { data, isLoading, isError } = useGetPaymentsQuery({ page, limit: 20 });
  const { data: gateways } = useGetPaymentGatewaysQuery();
  const { data: gatewaysHealth } = useGetAdminGatewaysHealthQuery();
  const { data: webhookData, isLoading: wLoading } =
    useGetAdminWebhookLogsQuery({ status: webhookFilter || undefined });
  const [retryWebhook] = useRetryAdminWebhookMutation();

  const { data: ticketsData, isLoading: ticketsLoading, isError: ticketsError } = useGetPaymentTicketsQuery({ page: ticketPage, limit: 20 });
  const [resolveTicket] = useResolvePaymentTicketMutation();

  const payments = data?.items ?? [];
  const filtered = search
    ? payments.filter((p: any) =>
        p.invoice?.client?.companyName?.includes(search),
      )
    : payments;

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
        description="جميع المدفوعات وبوابات الدفع وسجل الويب هوك"
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
        <StatCard title="إجمالي المدفوعات" value={data?.total ?? 0} icon={CreditCard} />
        <StatCard title="ناجحة" value={payments.filter((p: any) => p.status === "COMPLETED" || p.status === "SUCCESSFUL").length} variant="success" />
        <StatCard title="فاشلة" value={payments.filter((p: any) => p.status === "FAILED").length} variant="danger" />
        <StatCard title="معلقة" value={payments.filter((p: any) => p.status === "PENDING").length} variant="warning" />
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
          <TabsTrigger value="webhooks">
            <Webhook className="size-4 ml-1" />
            الويب هوك
          </TabsTrigger>
          <TabsTrigger value="tickets">
            <Ticket className="size-4 ml-1" />
            تذاكر الدفع
          </TabsTrigger>
        </TabsList>

        <TabsContent value="payments" className="mt-4">
          <SurfaceCard>
            <div className="relative max-w-sm mb-4">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 size-4 text-portal-note-text" />
              <FormInputControl
                placeholder="ابحث عن عميل..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pr-10"
              />
            </div>

            <DataTable
              columns={[
                { id: "client", label: "العميل" },
                { id: "amount", label: "المبلغ" },
                { id: "method", label: "طريقة الدفع" },
                { id: "status", label: "الحالة" },
                { id: "date", label: "التاريخ", align: "left" },
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
                    <Pill tone="neutral">{p.method}</Pill>
                  </td>
                  <td className="px-5 py-3">
                    <StatusBadge
                      status={p.status}
                      label={PAYMENT_STATUS_AR[p.status] ?? p.status}
                    />
                  </td>
                  <td className="px-5 py-3 text-sm text-portal-note-text text-left">
                    {p.createdAt?.slice(0, 10) ?? "—"}
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
                  <p className="text-center text-portal-note-text py-8">
                    لا توجد بوابات دفع مكونة
                  </p>
                )}
            </div>
          </SurfaceCard>
        </TabsContent>

        <TabsContent value="webhooks" className="mt-4">
          <SurfaceCard title="سجل الويب هوك">
            <div className="flex items-center gap-3 mb-4">
              <select
                value={webhookFilter}
                onChange={(e) => setWebhookFilter(e.target.value)}
                className="rounded-xl border border-portal-divider px-3 py-2 text-sm"
              >
                <option value="">كل الحالات</option>
                <option value="failed">فاشل</option>
                <option value="success">ناجح</option>
              </select>
            </div>

            <DataTable
              columns={[
                { id: "provider", label: "المزود" },
                { id: "eventType", label: "نوع الحدث" },
                { id: "status", label: "الحالة" },
                { id: "error", label: "الخطأ" },
                { id: "date", label: "التاريخ", align: "left" },
                { id: "actions", label: "", align: "left" },
              ]}
              data={webhookData?.items ?? []}
              isLoading={wLoading}
              isError={false}
              emptyState={{
                icon: Webhook,
                message: "لا توجد سجلات ويب هوك",
                hint: "لم يتم استقبال أي أحداث ويب هوك بعد",
              }}
              renderRow={(w: any) => (
                <tr key={w.id} className="border-b border-portal-divider">
                  <td className="px-5 py-3 text-sm font-medium">
                    {w.provider}
                  </td>
                  <td className="px-5 py-3 text-sm text-portal-note-text">
                    {w.eventType}
                  </td>
                  <td className="px-5 py-3">
                    <Pill tone={w.processed ? "success" : "danger"}>
                      {w.processed ? "ناجح" : "فاشل"}
                    </Pill>
                  </td>
                  <td className="px-5 py-3 text-sm text-portal-note-text max-w-xs truncate">
                    {w.error ?? "—"}
                  </td>
                  <td className="px-5 py-3 text-sm text-portal-note-text text-left">
                    {w.createdAt?.slice(0, 10) ?? "—"}
                  </td>
                  <td className="px-5 py-3 text-left">
                    {!w.processed && (
                      <ActionButton
                        variant="ghost"
                        size="sm"
                        onClick={async () => {
                          try {
                            await retryWebhook(w.id).unwrap();
                            toast.success("تم إعادة محاولة الويب هوك");
                          } catch {
                            toast.error("فشلت إعادة المحاولة");
                          }
                        }}
                      >
                        <RefreshCw className="size-4 ml-1" />
                        إعادة
                      </ActionButton>
                    )}
                  </td>
                </tr>
              )}
            />
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
    </div>
  );
}
