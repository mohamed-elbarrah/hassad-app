"use client";

import { useGetProjectsQuery } from "@/features/projects/projectsApi";
import { useGetDeliverablesByProjectQuery } from "@/features/deliverables/deliverablesApi";
import { SurfaceCard } from "@/components/design-system/SurfaceCard";
import { StatusBadge } from "@/components/design-system/StatusBadge";
import { Skeleton as DSSkeleton } from "@/components/design-system/Skeleton";
import type { Project } from "@hassad/shared";
import { formatShortDate } from "@/lib/format";

function ProjectRevisions({ project }: { project: Project }) {
  const { data: deliverables, isLoading } = useGetDeliverablesByProjectQuery(
    project.id,
  );

  const withRevisions = deliverables?.filter(
    (d) => (d.revisionRequests?.length ?? 0) > 0,
  );

  if (isLoading) {
    return <DSSkeleton className="h-10 w-full" />;
  }

  if (!withRevisions?.length) return null;

  return (
    <div className="border rounded-lg overflow-hidden">
      <div className="bg-neutral-50/40 px-4 py-2 font-medium text-sm">
        {project.name}
      </div>
      <div className="divide-y">
        {withRevisions.map((deliverable) =>
          deliverable.revisionRequests?.map((rev) => (
            <div
              key={rev.id}
              className="flex items-start justify-between px-4 py-3 text-sm"
            >
              <div className="flex flex-col gap-1">
                <span className="font-medium">{deliverable.title}</span>
                <span className="text-neutral-300 text-xs">
                  {rev.description}
                </span>
                <span className="text-neutral-300 text-xs" dir="ltr">
                  {formatShortDate(rev.createdAt)}
                </span>
              </div>
              <StatusBadge
                status={
                  rev.status === "DONE"
                    ? "COMPLETED"
                    : rev.status === "IN_REVIEW"
                      ? "IN_PROGRESS"
                      : "PENDING"
                }
                label={
                  rev.status === "DONE"
                    ? "منجز"
                    : rev.status === "IN_REVIEW"
                      ? "جارٍ"
                      : "معلّق"
                }
              />
            </div>
          )),
        )}
      </div>
    </div>
  );
}

export default function PMChangeRequestsPage() {
  const { data, isLoading, isError } = useGetProjectsQuery({ limit: 20 });

  return (
    <div className="flex flex-col gap-6" dir="rtl">
      <div>
        <h1 className="text-2xl font-semibold">طلبات التعديل</h1>
        <p className="text-sm text-neutral-300 mt-1">
          الطلبات الواردة من العملاء على التسليمات.
        </p>
      </div>

      {isLoading && (
        <SurfaceCard>
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <DSSkeleton key={i} className="h-16 w-full" />
            ))}
          </div>
        </SurfaceCard>
      )}

      {isError && (
        <p className="text-sm text-danger-500">حدث خطأ أثناء تحميل المشاريع.</p>
      )}

      {!isLoading && !isError && data && (
        <SurfaceCard title="طلبات التعديل لكل مشروع">
          <div className="flex flex-col gap-4">
            {data.items.length === 0 && (
              <p className="text-sm text-neutral-300">لا توجد مشاريع نشطة.</p>
            )}
            {data.items.map((project) => (
              <ProjectRevisions key={project.id} project={project} />
            ))}
          </div>
        </SurfaceCard>
      )}
    </div>
  );
}
