"use client";
import { use } from "react";
import { AdminPageError } from "@/components/dashboard/admin/shared/AdminPageError";
import { AdminPageLoading } from "@/components/dashboard/admin/shared/AdminPageLoading";
import { ProjectHistoryTable } from "@/components/project-detail/ProjectDetailPattern";
import { useGetAdminProjectTimelineQuery } from "@/features/admin/adminProjectsApi";
export default function ProjectsDetailTimeline({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params); const query = useGetAdminProjectTimelineQuery(id);
  if (query.isLoading) return <AdminPageLoading />;
  if (query.isError) return <AdminPageError onRetry={query.refetch} title="تعذر تحميل التسلسل الزمني" />;
  return query.data?.length ? <ProjectHistoryTable history={query.data.map((entry) => ({ id: entry.id, action: entry.action, createdAt: entry.createdAt, userName: entry.user?.name }))} /> : <AdminPageError title="لا يوجد سجل" description="لا توجد حركات مسجلة لهذا المشروع بعد." />;
}
