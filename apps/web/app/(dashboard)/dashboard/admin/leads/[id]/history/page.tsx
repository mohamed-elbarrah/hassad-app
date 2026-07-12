"use client";

import { use } from "react";
import { ArrowLeft, User, MessageSquare } from "lucide-react";
import { SurfaceCard } from "@/components/design-system/SurfaceCard";
import { AdminStatusBadge } from "@/components/dashboard/admin/shared/AdminStatusBadge";
import { AdminEmptyState } from "@/components/dashboard/admin/shared/AdminEmptyState";
import { useGetAdminLeadByIdQuery } from "@/features/admin/adminLeadsApi";
import { PIPELINE_STAGE_AR } from "@hassad/shared";

export default function LeadHistoryTab({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const { data: lead } = useGetAdminLeadByIdQuery(id);

  if (!lead) return null;

  if (lead.pipelineHistory.length === 0) {
    return (
      <AdminEmptyState
        icon={MessageSquare}
        title="لا يوجد سجل للمراحل"
        description="لم يتم تسجيل أي تغييرات في مراحل هذا العميل المتوقع بعد."
      />
    );
  }

  return (
    <SurfaceCard title="سجل تغيير المراحل">
      <div className="space-y-3">
        {lead.pipelineHistory.map((entry) => (
          <div
            key={entry.id}
            className="flex items-start gap-4 p-4 rounded-xl border border-portal-card-border"
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-secondary-100 shrink-0 mt-1">
              <ArrowLeft className="h-4 w-4 text-secondary-600" />
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                {entry.fromStage && (
                  <>
                    <AdminStatusBadge
                      domain="lead"
                      status={entry.fromStage}
                    />
                    <ArrowLeft className="h-3.5 w-3.5 text-portal-note-text" />
                  </>
                )}
                <AdminStatusBadge domain="lead" status={entry.toStage} />
              </div>

              {entry.reason && (
                <p className="text-sm text-portal-note-text mt-2">
                  {entry.reason}
                </p>
              )}

              <div className="flex items-center gap-3 mt-2 text-xs text-portal-note-text">
                <span className="flex items-center gap-1">
                  <User className="h-3 w-3" />
                  {entry.changer?.name || entry.changedBy}
                </span>
                <span>
                  {new Date(entry.changedAt).toLocaleDateString("ar-SA", {
                    dateStyle: "medium",
                    timeStyle: "short",
                  })}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </SurfaceCard>
  );
}
