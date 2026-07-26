"use client";

import { useState } from "react";
import { Webhook, RefreshCw, CheckCircle, XCircle } from "lucide-react";
import { PageIntro } from "@/components/design-system/PageIntro";
import { SurfaceCard } from "@/components/design-system/SurfaceCard";
import { AdminEmptyState } from "@/components/dashboard/admin/shared/AdminEmptyState";
import {
  useGetAdminWebhookLogsQuery,
  useRetryAdminWebhookMutation,
} from "@/features/admin/adminFinanceApi";
import { cn } from "@/lib/utils";

const STATUS_OPTIONS = [
  { value: "", label: "الكل" },
  { value: "success", label: "ناجح" },
  { value: "failed", label: "فاشل" },
];

const PROVIDER_OPTIONS = [
  { value: "", label: "جميع المزودين" },
  { value: "stripe", label: "Stripe" },
];

export default function AdminWebhookLogsPage() {
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState("");
  const [providerFilter, setProviderFilter] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const { data, isLoading, isError } = useGetAdminWebhookLogsQuery({
    status: statusFilter || undefined,
    provider: providerFilter || undefined,
    page,
    limit: 20,
  });

  const [retryWebhook, { isLoading: retrying }] = useRetryAdminWebhookMutation();

  if (isError) {
    return (
      <div className="page-shell" dir="rtl">
        <AdminEmptyState
          icon={Webhook}
          title="حدث خطأ أثناء تحميل سجلات Webhook"
          description="يرجى تحديث الصفحة والمحاولة مرة أخرى."
        />
      </div>
    );
  }

  return (
    <div className="page-shell" dir="rtl">
      <PageIntro
        title="سجلات Webhook"
        description="مراقبة ومعالجة أحداث Webhook من مزودي الدفع"
        icon={Webhook}
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
            value={providerFilter}
            onChange={(e) => {
              setProviderFilter(e.target.value);
              setPage(1);
            }}
          >
            {PROVIDER_OPTIONS.map((opt) => (
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
          <div className="space-y-2">
            {(data?.items ?? []).length === 0 ? (
              <p className="text-sm text-portal-note-text text-center py-12">
                لا توجد سجلات Webhook
              </p>
            ) : (
              (data?.items ?? []).map((log) => (
                <div
                  key={log.id}
                  className="rounded-xl border border-portal-card-border overflow-hidden"
                >
                  <button
                    onClick={() =>
                      setExpandedId(expandedId === log.id ? null : log.id)
                    }
                    className="w-full flex items-center justify-between p-4 hover:bg-portal-divider/20 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      {log.processed ? (
                        <CheckCircle className="h-5 w-5 text-success-500" />
                      ) : (
                        <XCircle className="h-5 w-5 text-danger-500" />
                      )}
                      <div className="text-right">
                        <p className="text-sm font-medium text-natural-100">
                          {log.provider}
                        </p>
                        <p className="text-xs text-portal-note-text">
                          {log.eventType}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span
                        className={cn(
                          "text-xs px-2 py-0.5 rounded-full font-medium",
                          log.processed
                            ? "bg-success-100 text-success-700"
                            : "bg-danger-100 text-danger-700",
                        )}
                      >
                        {log.processed ? "ناجح" : "فاشل"}
                      </span>
                      <span className="text-xs text-portal-note-text">
                        {new Date(log.createdAt).toLocaleDateString("ar-SA")}
                      </span>
                    </div>
                  </button>

                  {expandedId === log.id && (
                    <div className="px-4 pb-4 border-t border-portal-divider pt-3 space-y-3">
                      {log.error && (
                        <div className="text-sm text-danger-600 bg-danger-50 rounded-lg p-3">
                          <p className="font-medium mb-1">الخطأ:</p>
                          <p className="font-mono text-xs">{log.error}</p>
                        </div>
                      )}
                      <div className="text-sm">
                        <p className="font-medium text-portal-note-text mb-1">
          الحمولة (Payload):
                        </p>
                        <pre className="text-xs bg-portal-divider/30 rounded-lg p-3 overflow-x-auto max-h-48">
                          {JSON.stringify(log.payload, null, 2)}
                        </pre>
                      </div>
                      {!log.processed && (
                        <button
                          onClick={() => retryWebhook(log.id)}
                          disabled={retrying}
                          className="inline-flex items-center gap-2 text-sm px-4 py-2 rounded-xl bg-secondary-500 text-white hover:bg-secondary-600 disabled:opacity-50"
                        >
                          <RefreshCw
                            className={cn(
                              "h-4 w-4",
                              retrying && "animate-spin",
                            )}
                          />
                          إعادة المحاولة
                        </button>
                      )}
                    </div>
                  )}
                </div>
              ))
            )}
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
