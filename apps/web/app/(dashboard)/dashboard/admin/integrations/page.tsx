"use client";

import { useState } from "react";
import { Puzzle, Webhook, Radio, RefreshCw } from "lucide-react";
import { PageIntro } from "@/components/design-system/PageIntro";
import { SurfaceCard } from "@/components/design-system/SurfaceCard";
import { DataTable } from "@/components/design-system/DataTable";
import { Pill } from "@/components/design-system/Pill";
import { ActionButton } from "@/components/design-system/ActionButton";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/design-system/Tabs";
import { toast } from "sonner";
import {
  useGetAdminWebhookLogsQuery,
  useRetryAdminWebhookMutation,
} from "@/features/admin/adminApi";

export default function AdminIntegrationsPage() {
  const [webhookFilter, setWebhookFilter] = useState("");
  const { data: webhookData, isLoading: wLoading } = useGetAdminWebhookLogsQuery({ status: webhookFilter || undefined });
  const [retryWebhook] = useRetryAdminWebhookMutation();

  return (
    <div className="flex flex-col gap-6" dir="rtl">
      <PageIntro title="التكاملات والويب هوك" description="إدارة التكاملات مع الخدمات الخارجية" icon={Puzzle} />

      <Tabs defaultValue="webhooks" dir="rtl">
        <TabsList className="w-full justify-start gap-1">
          <TabsTrigger value="webhooks"><Webhook className="size-4 ml-1" />الويب هوك</TabsTrigger>
          <TabsTrigger value="platforms"><Radio className="size-4 ml-1" />منصات الإعلانات</TabsTrigger>
        </TabsList>

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
              columns={[{ id: "provider", label: "المزود" }, { id: "eventType", label: "نوع الحدث" }, { id: "status", label: "الحالة" }, { id: "error", label: "الخطأ" }, { id: "date", label: "التاريخ", align: "left" }, { id: "actions", label: "", align: "left" }]}
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
                      }}><RefreshCw className="size-4 ml-1" />إعادة</ActionButton>
                    )}
                  </td>
                </tr>
              )}
            />
          </SurfaceCard>
        </TabsContent>

        <TabsContent value="platforms" className="mt-4">
          <SurfaceCard title="اتصالات منصات الإعلانات">
            <p className="text-center text-portal-note-text py-12">سيتم إضافة إدارة اتصالات منصات الإعلانات قريباً</p>
          </SurfaceCard>
        </TabsContent>
      </Tabs>
    </div>
  );
}
