"use client";
import { use } from "react";
import { AdminPageError } from "@/components/dashboard/admin/shared/AdminPageError";
import { AdminPageLoading } from "@/components/dashboard/admin/shared/AdminPageLoading";
import { ProjectInvoicesTable, ProjectPaymentsTable } from "@/components/project-detail/ProjectDetailPattern";
import { useGetAdminProjectByIdQuery } from "@/features/admin/adminProjectsApi";
export default function ProjectsDetailFinance({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params); const query = useGetAdminProjectByIdQuery(id);
  if (query.isLoading) return <AdminPageLoading />;
  if (query.isError || !query.data) return <AdminPageError onRetry={query.refetch} title="تعذر تحميل مالية المشروع" />;
  return <div className="grid gap-6 xl:grid-cols-2"><ProjectInvoicesTable invoices={query.data.invoices} /><ProjectPaymentsTable payments={query.data.payments} /></div>;
}
