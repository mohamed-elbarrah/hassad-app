"use client";

import { use } from "react";
import { useGetAdminProjectByIdQuery } from "@/features/admin/adminProjectsApi";
import { AdminDetailError } from "@/components/dashboard/admin/shared/AdminDetailError";
import { AdminDetailSkeleton } from "@/components/dashboard/admin/shared/AdminDetailSkeleton";
import { ProjectContractServices } from "@/components/project-detail/ProjectContractPanels";

export default function AdminProjectServicesPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const { data: project, isLoading, isError, refetch } = useGetAdminProjectByIdQuery(id);

  if (isLoading) return <AdminDetailSkeleton />;
  if (isError || !project) {
    return (
      <AdminDetailError
        onRetry={refetch}
        backHref={`/dashboard/admin/projects/${id}`}
        backLabel="المشروع"
        title="تعذّر تحميل خدمات المشروع"
      />
    );
  }

  return (
    <ProjectContractServices
      services={project.contract?.servicesList}
      currency={project.contract?.currency ?? "SAR"}
    />
  );
}
