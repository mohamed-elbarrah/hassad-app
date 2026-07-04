"use client";

import { useState } from "react";
import { CreditCard, Search, Activity, Webhook, RefreshCw } from "lucide-react";
import { PageIntro } from "@/components/design-system/PageIntro";
import { SurfaceCard } from "@/components/design-system/SurfaceCard";
import { DataTable } from "@/components/design-system/DataTable";
import { StatusBadge } from "@/components/design-system/StatusBadge";
import { Pill } from "@/components/design-system/Pill";
import { ActionButton } from "@/components/design-system/ActionButton";
import { FormInputControl } from "@/components/design-system/FormInputControl";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/design-system/Tabs";
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

const STATUS_MAP: Record<string, string> = {
  PENDING: "معلق", SUCCESS: "ناجح", FAILED: "فاشل", REFUNDED: "مسترجع",
};

export default function AdminPaymentsPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [webhookFilter, setWebhookFilter] = useState("");

  const { data, isLoading, isError } = useGetPaymentsQuery({ page, limit: 20 });
  const { data: gateways } = useGetPaymentGatewaysQuery();
  const { data: gatewaysHealth } = useGetAdminGatewaysHealthQuery();
  const { data: webhookData, isLoading: wLoading } = useGetAdminWebhookLogsQuery({ status: webhookFilter || undefined });
  const [retryWebhook] = useRetryAdminWebhookMutation();

  const payments = data?.items ?? [];
  const filtered = search
    ? payments.filter((p: any) => p.invoice?.client?.companyName?.includes(search))
    : payments;

  return (
    <div className="flex flex-col gap-6" dir="rtl">
      <PageIntro title="المدفوعات" description="جميع المدفوعات وبوابات الدفع وسجل الويب هوك" icon={CreditCard} />

      <Tabs defaultValue="payments" dir="rtl">
        <TabsList className="w-full justify-start gap-1">
          <TabsTrigger value="payments"><CreditCard className="size-4 ml-1" />المدفوعات</TabsTrigger>
          <TabsTrigger value="gateways"><Activity className="size-4 ml-1" />بوابات الدفع</TabsTrigger>
          <TabsTrigger value="webhooks"><Webhook className="size-4 ml-1" />الويب هوك</TabsTrigger>
        </TabsList>

        <TabsContent value="payments" className="mt-4">
          <SurfaceCard>
            <div className="relative max-w-sm mb-4">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 size-4 text-portal-note-text" />
              <FormInputControl placeholder="ابحث عن عميل..." value={search} onChange={(e) => setSearch(e.target.value)} className="pr-10" />
            </div>

            <DataTable
              columns={[
                { id: "client", label: "العميل" },
                { id: "amount", label: "المبلغ" },
                { id: "method", label: "طريقة الدفع" },
                { id: "status", label: "الحالة" },
                { id: "date", label: "التاريخ", align: "left" },
              ]}
              data={filtered} isLoading={isLoading} isError={isError}
              emptyState={{ icon: CreditCard, message: "لا توجد مدفوعات", hint: "لم يتم تسجيل أي مدفوعات بعد" }}
              renderRow={(p: any) => (
                <tr key={p.id} className="border-b border-portal-divider">
                  <td className="px-5 py-3 text-sm font-medium">{p.invoice?.client?.companyName ?? "—"}</td>
                  <td className="px-5 py-3 text-sm">{p.amount?.toLocaleString()} ر.س</td>
                  <td className="px-5 py-3 text-sm"><Pill tone="neutral">{p.method}</Pill></td>
                  <td className="px-5 py-3"><StatusBadge status={p.status} label={STATUS_MAP[p.status] ?? p.status} /></td>
                  <td className="px-5 py-3 text-sm text-portal-note-text text-left">{p.createdAt?.slice(0, 10) ?? "—"}</td>
                </tr>
              )}
            />

            {data && data.totalPages > 1 && (
              <div className="flex items-center justify-between pt-4 border-t border-portal-divider mt-4">
                <span className="text-sm text-portal-note-text">إجمالي {data.total} دفعة</span>
                <div className="flex gap-2">
                  <ActionButton variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>السابق</ActionButton>
                  <ActionButton variant="outline" size="sm" disabled={page >= data.totalPages} onClick={() => setPage((p) => p + 1)}>التالي</ActionButton>
                </div>
              </div>
            )}
          </SurfaceCard>
        </TabsContent>

        <TabsContent value="gateways" className="mt-4">
          <SurfaceCard title="حالة بوابات الدفع">
            <div className="space-y-3">
              {(gatewaysHealth ?? gateways ?? []).map((g: any) => (
                <div key={g.id ?? g.name} className="flex items-center justify-between p-4 rounded-2xl border border-portal-divider">
                  <div className="flex items-center gap-3">
                    <div className={`size-3 rounded-full ${g.isActive ? "bg-success-500" : "bg-danger-500"}`} />
                    <div>
                      <p className="text-sm font-medium">{g.displayName ?? g.name}</p>
                      <p className="text-xs text-portal-note-text">{g.type ?? "—"}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Pill tone={g.isActive ? "success" : "danger"}>{g.isActive ? "نشط" : "غير نشط"}</Pill>
                    {g.totalPayments !== undefined && (
                      <span className="text-xs text-portal-note-text">{g.totalPayments} دفعة</span>
                    )}
                  </div>
                </div>
              ))}
              {(!gateways || gateways.length === 0) && (!gatewaysHealth || gatewaysHealth.length === 0) && (
                <p className="text-center text-portal-note-text py-8">لا توجد بوابات دفع مكونة</p>
              )}
            </div>
          </SurfaceCard>
        </TabsContent>

        <TabsContent value="webhooks" className="mt-4">
          <SurfaceCard title="سجل الويب هوك">
            <div className="flex items-center gap-3 mb-4">
              <select value={webhookFilter} onChange={(e) => setWebhookFilter(e.target.value)} className="rounded-xl border border-portal-divider px-3 py-2 text-sm">
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
              data={webhookData?.items ?? []} isLoading={wLoading} isError={false}
              emptyState={{ icon: Webhook, message: "لا توجد سجلات ويب هوك", hint: "لم يتم استقبال أي أحداث ويب هوك بعد" }}
              renderRow={(w: any) => (
                <tr key={w.id} className="border-b border-portal-divider">
                  <td className="px-5 py-3 text-sm font-medium">{w.provider}</td>
                  <td className="px-5 py-3 text-sm text-portal-note-text">{w.eventType}</td>
                  <td className="px-5 py-3"><Pill tone={w.processed ? "success" : "danger"}>{w.processed ? "ناجح" : "فاشل"}</Pill></td>
                  <td className="px-5 py-3 text-sm text-portal-note-text max-w-xs truncate">{w.error ?? "—"}</td>
                  <td className="px-5 py-3 text-sm text-portal-note-text text-left">{w.createdAt?.slice(0, 10) ?? "—"}</td>
                  <td className="px-5 py-3 text-left">
                    {!w.processed && (
                      <ActionButton variant="ghost" size="sm" onClick={async () => {
                        try { await retryWebhook(w.id).unwrap(); toast.success("تم إعادة محاولة الويب هوك"); }
                        catch { toast.error("فشلت إعادة المحاولة"); }
                      }}>
                        <RefreshCw className="size-4 ml-1" />إعادة
                      </ActionButton>
                    )}
                  </td>
                </tr>
              )}
            />
          </SurfaceCard>
        </TabsContent>
      </Tabs>
    </div>
  );
}
