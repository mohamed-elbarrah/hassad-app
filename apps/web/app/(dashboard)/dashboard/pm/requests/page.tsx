"use client";

import { useGetPmRevisionsQuery } from "@/features/projects/projectsApi";
import type { PmDeliverableWithRevisions } from "@/features/projects/projectsApi";
import { useAppSelector } from "@/lib/hooks";
import { SurfaceCard } from "@/components/design-system/SurfaceCard";
import { Skeleton as DSSkeleton } from "@/components/design-system/Skeleton";
import { formatShortDate } from "@/lib/format";
import { ClipboardList } from "lucide-react";
import { PageIntro } from "@/components/design-system/PageIntro";
import { PmEmptyState } from "@/components/dashboard/pm/shared/PmEmptyState";
import { PmStatusBadge } from "@/components/dashboard/pm/shared/PmStatusBadge";

// ── Component ─────────────────────────────────────────────────────────────────

export default function PMChangeRequestsPage() {
  const { user } = useAppSelector((state) => state.auth);

  const {
    data: deliverables = [],
    isLoading,
    isError,
  } = useGetPmRevisionsQuery(undefined, {
    skip: user?.role !== "PM",
  });

  // Group deliverables by project
  const groupedByProject = deliverables.reduce<
    Record<string, { projectName: string; deliverables: PmDeliverableWithRevisions[] }>
  >((acc, del) => {
    const projectId = del.project?.id ?? del.projectId;
    const projectName = del.project?.name ?? "مشروع غير معروف";
    if (!acc[projectId]) {
      acc[projectId] = { projectName, deliverables: [] };
    }
    acc[projectId].deliverables.push(del);
    return acc;
  }, {});

  const projectEntries = Object.entries(groupedByProject);

  return (
    <div className="flex flex-col gap-5" dir="rtl">
      <PageIntro
        title="طلبات التعديل"
        description="طلبات التعديل الواردة من العملاء على التسليمات في مشاريعك."
        icon={ClipboardList}
      />

      {isLoading && (
        <SurfaceCard>
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <DSSkeleton key={i} className="h-16 w-full rounded-xl" />
            ))}
          </div>
        </SurfaceCard>
      )}

      {isError && (
        <p className="text-sm text-danger-600">
          حدث خطأ أثناء تحميل طلبات التعديل.
        </p>
      )}

      {!isLoading && !isError && (
        <>
          {projectEntries.length === 0 ? (
            <SurfaceCard>
              <PmEmptyState
                icon={ClipboardList}
                title="لا توجد طلبات تعديل"
                description="لم يقدم العملاء أي طلبات تعديل على التسليمات بعد."
              />
            </SurfaceCard>
          ) : (
            <div className="space-y-5">
              {projectEntries.map(([projectId, group]) => (
                <SurfaceCard key={projectId} title={group.projectName}>
                  <div className="space-y-4">
                    {group.deliverables.map((deliverable) => (
                      <DeliverableRevisions
                        key={deliverable.id}
                        deliverable={deliverable}
                      />
                    ))}
                  </div>
                </SurfaceCard>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}

// ── Sub-component ─────────────────────────────────────────────────────────────

function DeliverableRevisions({
  deliverable,
}: {
  deliverable: PmDeliverableWithRevisions;
}) {
  return (
    <div className="border border-portal-card-border rounded-xl overflow-hidden">
      {/* Deliverable header */}
      <div className="bg-badge-gray-bg px-4 py-3 border-b border-portal-divider">
        <h3 className="font-medium text-sm text-natural-100">{deliverable.title}</h3>
        {deliverable.description && (
          <p className="text-xs text-portal-note-text mt-0.5 line-clamp-1">
            {deliverable.description}
          </p>
        )}
      </div>

      {/* Revision requests */}
      <div className="divide-y divide-portal-divider">
        {deliverable.revisionRequests.map((rev) => (
          <div
            key={rev.id}
            className="flex items-start justify-between px-4 py-3 text-sm gap-4"
          >
            <div className="flex flex-col gap-1 min-w-0">
              <p className="text-portal-note-text text-xs line-clamp-2">
                {rev.requestDescription}
              </p>
              <div className="flex items-center gap-2 text-xs text-portal-note-text">
                {rev.client?.companyName && (
                  <>
                    <span>{rev.client.companyName}</span>
                    <span>•</span>
                  </>
                )}
                <span dir="ltr">{formatShortDate(rev.createdAt)}</span>
              </div>
            </div>
            <PmStatusBadge
              domain="revision"
              status={rev.status}
              className="text-xs shrink-0"
            />
          </div>
        ))}
      </div>
    </div>
  );
}
