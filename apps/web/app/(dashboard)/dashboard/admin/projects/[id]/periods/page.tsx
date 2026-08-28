"use client";
import { use } from "react";
import { AdminPageError } from "@/components/dashboard/admin/shared/AdminPageError";
import { AdminPageLoading } from "@/components/dashboard/admin/shared/AdminPageLoading";
import { ProjectPeriodsTable } from "@/components/project-detail/ProjectDetailPattern";
import { useGetAdminProjectPeriodsQuery } from "@/features/admin/adminProjectsApi";
export default function ProjectsDetailPeriods({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params); const query = useGetAdminProjectPeriodsQuery(id);
  if (query.isLoading) return <AdminPageLoading />;
  if (query.isError) return <AdminPageError onRetry={query.refetch} title="تعذر تحميل فترات المشروع" />;
  return query.data?.length ? <ProjectPeriodsTable periods={query.data} /> : <AdminPageError title="لا توجد فترات" description="لم تتم إضافة فترات إلى هذا المشروع بعد." />;
}
