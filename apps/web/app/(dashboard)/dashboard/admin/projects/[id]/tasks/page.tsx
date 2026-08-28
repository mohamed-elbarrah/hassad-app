"use client";

import { use, useState } from "react";
import { AdminPageError } from "@/components/dashboard/admin/shared/AdminPageError";
import { AdminPageLoading } from "@/components/dashboard/admin/shared/AdminPageLoading";
import { ProjectTasksTable } from "@/components/project-detail/ProjectDetailPattern";
import { Button } from "@/components/ui/button";
import { useGetAdminProjectTasksQuery } from "@/features/admin/adminProjectsApi";

export default function ProjectsDetailTasks({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [page, setPage] = useState(1);
  const query = useGetAdminProjectTasksQuery({ id, page, limit: 20 });

  if (query.isLoading) return <AdminPageLoading />;
  if (query.isError || !query.data) {
    return <AdminPageError onRetry={query.refetch} title="تعذر تحميل مهام المشروع" />;
  }

  return (
    <div className="flex flex-col gap-4">
      <ProjectTasksTable tasks={query.data.items} />
      {query.data.totalPages > 1 && (
        <div className="flex items-center justify-between gap-3" dir="rtl" aria-label="ترقيم صفحات مهام المشروع">
          <span className="text-sm text-muted-foreground">
            الصفحة {query.data.page} من {query.data.totalPages}
          </span>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((current) => current - 1)}>
              السابقة
            </Button>
            <Button variant="outline" size="sm" disabled={page >= query.data.totalPages} onClick={() => setPage((current) => current + 1)}>
              التالية
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
