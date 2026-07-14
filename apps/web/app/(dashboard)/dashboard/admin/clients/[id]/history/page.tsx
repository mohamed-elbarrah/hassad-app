"use client";

import { use } from "react";
import { History } from "lucide-react";
import { SurfaceCard } from "@/components/design-system/SurfaceCard";
import { AdminEmptyState } from "@/components/dashboard/admin/shared/AdminEmptyState";
import { useGetAdminClientByIdQuery } from "@/features/admin/adminClientsApi";

const EVENT_ICONS: Record<string, string> = {
  CREATE: "➕",
  UPDATE: "✏️",
  STATUS_CHANGE: "🔄",
  LOGIN: "🔑",
  CONTRACT_CREATED: "📄",
  PROJECT_CREATED: "📁",
  INVOICE_CREATED: "🧾",
  PAYMENT_RECEIVED: "💰",
  PORTAL_ACCESS: "🚪",
};

const EVENT_LABELS: Record<string, string> = {
  CREATE: "إنشاء",
  UPDATE: "تحديث",
  STATUS_CHANGE: "تغيير الحالة",
  LOGIN: "تسجيل دخول",
  CONTRACT_CREATED: "إضافة عقد",
  PROJECT_CREATED: "إضافة مشروع",
  INVOICE_CREATED: "إضافة فاتورة",
  PAYMENT_RECEIVED: "دفعة مستلمة",
  PORTAL_ACCESS: "دخول البوابة",
};

export default function ClientHistoryTab({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const { data: client } = useGetAdminClientByIdQuery(id);

  if (!client) return null;

  const logs = client.historyLogs;

  if (logs.length === 0) {
    return (
      <SurfaceCard title="سجل النشاط">
        <AdminEmptyState
          icon={History}
          title="لا يوجد سجل نشاط"
          description="سيتم تسجيل جميع الأنشطة المتعلقة بهذا العميل هنا."
        />
      </SurfaceCard>
    );
  }

  return (
    <SurfaceCard title="سجل النشاط">
      <div className="relative">
        <div className="absolute right-3 top-0 bottom-0 w-0.5 bg-portal-divider" />
        <div className="space-y-0">
          {logs.map((log, idx) => (
            <div key={log.id} className="relative flex items-start gap-4 pb-6">
              <div className="relative z-10 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-badge-gray-bg text-xs">
                {EVENT_ICONS[log.eventType] || "📌"}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium px-2 py-0.5 rounded-md bg-badge-gray-bg text-portal-note-text">
                    {EVENT_LABELS[log.eventType] || log.eventType}
                  </span>
                  <span className="text-xs text-portal-note-text">
                    {new Date(log.occurredAt).toLocaleDateString("ar-SA", {
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </div>
                <p className="text-sm text-natural-100 mt-1">
                  {log.description}
                </p>
                {log.userName && (
                  <p className="text-xs text-portal-note-text mt-0.5">
                    بواسطة: {log.userName}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </SurfaceCard>
  );
}
