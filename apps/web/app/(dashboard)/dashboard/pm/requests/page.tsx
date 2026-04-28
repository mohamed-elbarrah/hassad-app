"use client";

import { useGetProjectsQuery } from "@/features/projects/projectsApi";
import { useGetDeliverablesByProjectQuery } from "@/features/deliverables/deliverablesApi";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import type { Project } from "@hassad/shared";

function ProjectRevisions({ project }: { project: Project }) {
  const { data: deliverables, isLoading } = useGetDeliverablesByProjectQuery(
    project.id,
  );

  const withRevisions = deliverables?.filter(
    (d) => (d.revisionRequests?.length ?? 0) > 0,
  );

  if (isLoading) {
    return <Skeleton className="h-10 w-full" />;
  }

  if (!withRevisions?.length) return null;

  return (
    <div className="border rounded-lg overflow-hidden">
      <div className="bg-muted/40 px-4 py-2 font-medium text-sm">{project.name}</div>
      <div className="divide-y">
        {withRevisions.map((deliverable) =>
          deliverable.revisionRequests?.map((rev) => (
            <div
              key={rev.id}
              className="flex items-start justify-between px-4 py-3 text-sm"
            >
              <div className="flex flex-col gap-1">
                <span className="font-medium">{deliverable.title}</span>
                <span className="text-muted-foreground text-xs">{rev.description}</span>
                <span className="text-muted-foreground text-xs" dir="ltr">
                  {new Date(rev.createdAt).toLocaleDateString("ar-DZ")}
                </span>
              </div>
              <Badge
                variant={
                  rev.status === "DONE"
                    ? "secondary"
                    : rev.status === "IN_REVIEW"
                      ? "default"
                      : "outline"
                }
              >
                {rev.status === "DONE"
                  ? "منجز"
                  : rev.status === "IN_REVIEW"
                    ? "جارٍ"
                    : "معلّق"}
              </Badge>
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
        <p className="text-sm text-muted-foreground mt-1">
          الطلبات الواردة من العملاء على التسليمات.
        </p>
      </div>

      {isLoading && (
        <Card>
          <CardContent className="pt-6 space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </CardContent>
        </Card>
      )}

      {isError && (
        <p className="text-sm text-destructive">حدث خطأ أثناء تحميل المشاريع.</p>
      )}

      {!isLoading && !isError && data && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">طلبات التعديل لكل مشروع</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            {data.items.length === 0 && (
              <p className="text-sm text-muted-foreground">لا توجد مشاريع نشطة.</p>
            )}
            {data.items.map((project) => (
              <ProjectRevisions key={project.id} project={project} />
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
