"use client";

import { use } from "react";
import { Clock, ArrowLeft } from "lucide-react";
import { SurfaceCard } from "@/components/design-system/SurfaceCard";
import { AdminStatusBadge } from "@/components/dashboard/admin/shared/AdminStatusBadge";
import { useGetAdminRequestByIdQuery } from "@/features/admin/adminRequestsApi";
import { REQUEST_STATUS_AR } from "@hassad/shared";
import { cn } from "@/lib/utils";

export default function RequestTimelineTab({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const { data: request } = useGetAdminRequestByIdQuery(id);

  if (!request) return null;

  const history = request.statusHistory;

  if (history.length === 0) {
    return (
      <div dir="rtl">
        <SurfaceCard title="التسلسل الزمني للحالة">
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <Clock className="h-10 w-10 text-portal-note-text mb-3" />
            <p className="text-sm text-portal-note-text">
              لا يوجد سجل زمني لهذا الطلب بعد.
            </p>
          </div>
        </SurfaceCard>
      </div>
    );
  }

  return (
    <div dir="rtl">
      <SurfaceCard title="التسلسل الزمني للحالة">
        <div className="relative">
          <div className="absolute right-[7px] top-2 bottom-2 w-[2px] bg-portal-divider" />

          <div className="space-y-6">
            {history.map((entry, idx) => (
              <div key={entry.id} className="relative flex gap-4">
                <div
                  className={cn(
                    "relative z-10 mt-1.5 h-4 w-4 shrink-0 rounded-full border-2",
                    idx === 0
                      ? "border-secondary-500 bg-secondary-500"
                      : "border-portal-card-border bg-natural-0",
                  )}
                />

                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    {entry.fromStatus ? (
                      <div className="flex items-center gap-1">
                        <AdminStatusBadge
                          domain="request"
                          status={entry.fromStatus}
                        />
                        <ArrowLeft className="h-3 w-3 text-portal-note-text" />
                      </div>
                    ) : null}
                    <AdminStatusBadge
                      domain="request"
                      status={entry.toStatus}
                    />
                  </div>

                  <p className="text-xs text-portal-note-text">
                    {entry.changer.name}
                    {" — "}
                    {new Date(entry.changedAt).toLocaleString("ar-SA")}
                  </p>

                  {entry.note && (
                    <p className="text-sm text-natural-100 mt-2 bg-portal-bg p-3 rounded-xl border border-portal-card-border">
                      {entry.note}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </SurfaceCard>
    </div>
  );
}
