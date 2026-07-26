"use client";

import { useState } from "react";
import { Activity, CheckCircle, XCircle, Clock } from "lucide-react";
import { PageIntro } from "@/components/design-system/PageIntro";
import { SurfaceCard } from "@/components/design-system/SurfaceCard";
import { AdminEmptyState } from "@/components/dashboard/admin/shared/AdminEmptyState";
import { useGetAdminPaymentEventsQuery } from "@/features/admin/adminFinanceApi";
import { cn } from "@/lib/utils";

const fmtCurrency = (n: number) =>
  new Intl.NumberFormat("ar-SA", {
    style: "currency",
    currency: "SAR",
    minimumFractionDigits: 0,
  }).format(n);

const STATUS_ICONS: Record<string, typeof CheckCircle> = {
  SUCCESS: CheckCircle,
  FAILED: XCircle,
  PENDING: Clock,
};

const STATUS_COLORS: Record<string, string> = {
  SUCCESS: "text-success-500",
  FAILED: "text-danger-500",
  PENDING: "text-warning-500",
};

export default function AdminPaymentEventsPage() {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const { data, isLoading, isError } = useGetAdminPaymentEventsQuery();

  if (isError) {
    return (
      <div className="page-shell" dir="rtl">
        <AdminEmptyState
          icon={Activity}
          title="حدث خطأ أثناء تحميل أحداث الدفع"
          description="يرجى تحديث الصفحة والمحاولة مرة أخرى."
        />
      </div>
    );
  }

  return (
    <div className="page-shell" dir="rtl">
      <PageIntro
        title="أحداث الدفع"
        description="سجل أحداث الدفع من مزودي الدفع"
        icon={Activity}
      />

      <SurfaceCard>
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
            {(data ?? []).length === 0 ? (
              <p className="text-sm text-portal-note-text text-center py-12">
                لا توجد أحداث دفع مسجلة
              </p>
            ) : (
              (data ?? []).map((event) => {
                const StatusIcon =
                  STATUS_ICONS[event.status] || Activity;
                const statusColor = STATUS_COLORS[event.status] || "text-portal-note-text";
                return (
                  <div
                    key={event.id}
                    className="rounded-xl border border-portal-card-border overflow-hidden"
                  >
                    <button
                      onClick={() =>
                        setExpandedId(
                          expandedId === event.id ? null : event.id,
                        )
                      }
                      className="w-full flex items-center justify-between p-4 hover:bg-portal-divider/20 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <StatusIcon
                          className={cn("h-5 w-5", statusColor)}
                        />
                        <div className="text-right">
                          <p className="text-sm font-medium text-natural-100">
                            {event.eventType}
                          </p>
                          <p className="text-xs text-portal-note-text">
                            {fmtCurrency(event.amount)} ·{" "}
                            {event.payment.method}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span
                          className={cn(
                            "text-xs px-2 py-0.5 rounded-full font-medium",
                            event.status === "SUCCESS"
                              ? "bg-success-100 text-success-700"
                              : event.status === "FAILED"
                                ? "bg-danger-100 text-danger-700"
                                : "bg-warning-100 text-warning-700",
                          )}
                        >
                          {event.status === "SUCCESS"
                            ? "ناجح"
                            : event.status === "FAILED"
                              ? "فاشل"
                              : "قيد الانتظار"}
                        </span>
                        <span className="text-xs text-portal-note-text">
                          {new Date(event.createdAt).toLocaleDateString(
                            "ar-SA",
                            {
                              year: "numeric",
                              month: "short",
                              day: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            },
                          )}
                        </span>
                      </div>
                    </button>

                    {expandedId === event.id && (
                      <div className="px-4 pb-4 border-t border-portal-divider pt-3 space-y-3">
                        <div className="text-sm">
                          <p className="font-medium text-portal-note-text mb-1">
                            التفاصيل:
                          </p>
                          <pre className="text-xs bg-portal-divider/30 rounded-lg p-3 overflow-x-auto max-h-64">
                            {JSON.stringify(event.metadata, null, 2)}
                          </pre>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        )}
      </SurfaceCard>
    </div>
  );
}
