"use client";

import { use } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Empty, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty";
import { FileText, Megaphone, Target, Users } from "lucide-react";
import { ProjectFilesTable, ProjectMeetingsTable } from "@/components/project-detail/ProjectDetailPattern";
import { useGetAdminProjectByIdQuery } from "@/features/admin/adminProjectsApi";
import { formatNumber } from "@/lib/format";
import { AdminPageError } from "@/components/dashboard/admin/shared/AdminPageError";

const labels: Record<string, string> = {
  goals: "الأهداف",
  files: "الملفات",
  reports: "التقارير",
  campaigns: "الحملات",
  meetings: "الاجتماعات",
};

export default function AdminProjectSectionPage({
  params,
}: {
  params: Promise<{ id: string; section: string }>;
}) {
  const { id, section } = use(params);
  const { data: project, isLoading, isError, refetch } = useGetAdminProjectByIdQuery(id);
  const title = labels[section];

  if (!title) return <AdminPageError title="قسم المشروع غير موجود" />;
  if (isLoading) return <Card><CardContent className="p-6">جارٍ تحميل {title}...</CardContent></Card>;
  if (isError || !project) return <AdminPageError onRetry={refetch} title={`تعذر تحميل ${title}`} />;

  if (section === "files") {
    return <ProjectFilesTable files={project.files} />;
  }

  if (section === "meetings") {
    return <ProjectMeetingsTable meetings={project.meetings} />;
  }

  const icon = section === "goals" ? Target : section === "campaigns" ? Megaphone : section === "reports" ? FileText : Users;
  const Icon = icon;
  const description = section === "reports"
    ? `نسبة الإنجاز الحالية للمشروع: ${formatNumber(project.completionPercentage)}%`
    : section === "campaigns"
      ? "لا توجد حملات مرتبطة بالمشروع في بيانات المشروع الحالية."
      : section === "goals"
        ? "لا توجد أهداف مستقلة مرتبطة بالمشروع في بيانات المشروع الحالية."
        : "لا توجد بيانات مرتبطة بهذا القسم في بيانات المشروع الحالية.";

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2"><Icon className="size-5" />{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <Empty className="border">
          <EmptyMedia variant="icon"><Icon /></EmptyMedia>
          <EmptyHeader><EmptyTitle>لا توجد سجلات إضافية</EmptyTitle></EmptyHeader>
        </Empty>
      </CardContent>
    </Card>
  );
}
