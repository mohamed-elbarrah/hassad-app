"use client";

import { useGetProjectsQuery } from "@/features/projects/projectsApi";
import { DataTable } from "@/components/design-system/DataTable";
import { FolderKanban } from "lucide-react";
import { SalesStatusBadge } from "@/components/dashboard/sales/shared/SalesStatusBadge";
import { formatShortDate } from "@/lib/format";

interface ProjectsTabProps {
  clientId: string;
}

export function ProjectsTab({ clientId }: ProjectsTabProps) {
  const { data, isLoading, isError, error } = useGetProjectsQuery({
    clientId,
  });

  const isPermissionDenied = isError && (error as any)?.status === 403;

  if (isPermissionDenied) {
    return (
      <div className="text-center py-12">
        <FolderKanban className="h-12 w-12 text-portal-note-text mx-auto mb-3" />
        <p className="text-portal-note-text">ليس لديك صلاحية لعرض المشاريع</p>
      </div>
    );
  }

  return (
    <DataTable
      columns={[
        { id: "name", label: "اسم المشروع" },
        { id: "status", label: "الحالة" },
        { id: "startDate", label: "تاريخ البداية" },
        { id: "endDate", label: "تاريخ النهاية" },
        { id: "manager", label: "مدير المشروع" },
      ]}
      data={data?.items ?? []}
      isLoading={isLoading}
      isError={isError && !isPermissionDenied}
      errorMessage="تعذر تحميل المشاريع"
      skeletonRows={5}
      emptyState={{
        icon: FolderKanban,
        message: "لا توجد مشاريع لهذا العميل",
        hint: "سيظهر هنا المشاريع المرتبطة بالعميل عند إنشائها.",
      }}
      renderCells={(project) => [
        <td key="name" className="px-5 py-3.5 align-middle">
          <span className="text-sm font-medium text-natural-100">
            {project.name}
          </span>
        </td>,
        <td key="status" className="px-5 py-3.5 align-middle">
          <SalesStatusBadge domain="project" status={project.status} />
        </td>,
        <td key="startDate" className="px-5 py-3.5 align-middle">
          <span className="text-sm text-portal-note-text">
            {formatShortDate(project.startDate)}
          </span>
        </td>,
        <td key="endDate" className="px-5 py-3.5 align-middle">
          <span className="text-sm text-portal-note-text">
            {formatShortDate(project.endDate)}
          </span>
        </td>,
        <td key="manager" className="px-5 py-3.5 align-middle">
          <span className="text-sm text-portal-note-text">
            {project.manager?.name ?? "—"}
          </span>
        </td>,
      ]}
    />
  );
}
