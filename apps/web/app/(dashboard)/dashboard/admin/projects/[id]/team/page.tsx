"use client";
import { use } from "react";
import { AdminPageError } from "@/components/dashboard/admin/shared/AdminPageError";
import { AdminPageLoading } from "@/components/dashboard/admin/shared/AdminPageLoading";
import { ProjectTeamTable } from "@/components/project-detail/ProjectDetailPattern";
import { useGetAdminProjectTeamQuery } from "@/features/admin/adminProjectsApi";
export default function ProjectsDetailTeam({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params); const query = useGetAdminProjectTeamQuery(id);
  if (query.isLoading) return <AdminPageLoading />;
  if (query.isError) return <AdminPageError onRetry={query.refetch} title="تعذر تحميل فريق المشروع" />;
  return query.data?.length ? <ProjectTeamTable members={query.data} /> : <AdminPageError title="لا يوجد أعضاء" description="لم تتم إضافة أعضاء إلى هذا المشروع بعد." />;
}
