"use client";

import { useGetProjectsQuery } from "@/features/projects/projectsApi";
import { Skeleton } from "@/components/design-system/Skeleton";
import { Pill } from "@/components/design-system/Pill";
import { formatDate } from "@/lib/format";
import { ProjectStatus, PROJECT_STATUS_AR } from "@hassad/shared";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { FolderKanban } from "lucide-react";

const STATUS_TONE: Record<
  ProjectStatus,
  import("@/components/design-system/Pill").PillTone
> = {
  [ProjectStatus.PLANNING]: "blue",
  [ProjectStatus.ACTIVE]: "success",
  [ProjectStatus.ON_HOLD]: "neutral",
  [ProjectStatus.AWAITING_REVIEW]: "purple",
  [ProjectStatus.NEEDS_REVISION]: "warning",
  [ProjectStatus.COMPLETED]: "success",
  [ProjectStatus.CANCELLED]: "danger",
};

interface ProjectsTabProps {
  clientId: string;
}

export function ProjectsTab({ clientId }: ProjectsTabProps) {
  const { data, isLoading, isError } = useGetProjectsQuery({ clientId });

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64 rounded-xl" />
      </div>
    );
  }

  if (isError || !data) {
    return (
      <p className="text-sm text-neutral-300 text-center py-8">
        تعذر تحميل المشاريع
      </p>
    );
  }

  if (data.items.length === 0) {
    return (
      <div className="text-center py-12">
        <FolderKanban className="h-12 w-12 text-neutral-200 mx-auto mb-3" />
        <p className="text-neutral-300">لا توجد مشاريع لهذا العميل</p>
      </div>
    );
  }

  return (
    <div className="rounded-[30px] border-[1.5px] border-portal-card-border overflow-hidden">
      <Table>
        <TableHeader className="[tr]:border-b-[1.5px] [tr]:border-portal-divider">
          <TableRow className="hover:bg-transparent">
            <TableHead className="h-12 whitespace-nowrap px-5 text-sm font-medium text-portal-note-text">
              اسم المشروع
            </TableHead>
            <TableHead className="h-12 whitespace-nowrap px-5 text-sm font-medium text-portal-note-text">
              الحالة
            </TableHead>
            <TableHead className="h-12 whitespace-nowrap px-5 text-sm font-medium text-portal-note-text">
              تاريخ البداية
            </TableHead>
            <TableHead className="h-12 whitespace-nowrap px-5 text-sm font-medium text-portal-note-text">
              تاريخ النهاية
            </TableHead>
            <TableHead className="h-12 whitespace-nowrap px-5 text-sm font-medium text-portal-note-text">
              مدير المشروع
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody className="[&_tr:last-child]:border-0 [&_tr:nth-child(even)]:bg-[#f0f2f5] [&_tr:hover]:bg-black/[0.03]">
          {data.items.map((project) => (
            <TableRow
              key={project.id}
              className="border-b-[1.5px] border-portal-divider hover:bg-transparent text-right"
            >
              <TableCell className="px-5 py-4 font-medium">
                {project.name}
              </TableCell>
              <TableCell className="px-5 py-4">
                <Pill
                  tone={STATUS_TONE[project.status] ?? "neutral"}
                  className="text-xs h-6 px-2"
                >
                  {PROJECT_STATUS_AR[project.status] ?? project.status}
                </Pill>
              </TableCell>
              <TableCell className="px-5 py-4">
                {formatDate(project.startDate)}
              </TableCell>
              <TableCell className="px-5 py-4">
                {formatDate(project.endDate)}
              </TableCell>
              <TableCell className="px-5 py-4 text-neutral-300">
                {project.projectManagerId ?? "—"}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
