"use client";

import { useState } from "react";
import { Activity, FolderOpen } from "lucide-react";
import { useGetPortalProjectsQuery } from "@/features/portal/portalApi";
import { ProjectStatus } from "@hassad/shared";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { PortalPageIntro } from "@/components/portal/PortalPageIntro";
import { PortalSurfaceCard } from "@/components/portal/PortalSurfaceCard";
import { StatusBadge } from "@/components/portal/StatusBadge";
import { mapProjectStatusToUI } from "@/lib/utils/statusMapping";
import { cn } from "@/lib/utils";

const STATUS_FILTERS: { label: string; value: string }[] = [
  { label: "الكل", value: "" },
  { label: "نشط", value: ProjectStatus.ACTIVE },
  { label: "تخطيط", value: ProjectStatus.PLANNING },
  { label: "معلق", value: ProjectStatus.ON_HOLD },
  { label: "مكتمل", value: ProjectStatus.COMPLETED },
  { label: "ملغى", value: ProjectStatus.CANCELLED },
];

const PAGE_SIZE = 6;

function ProjectSummaryPill({
  label,
  value,
}: {
  label: string;
  value: string | number;
}) {
  return (
    <div className="min-w-33 rounded-2xl border-[1.5px] border-portal-card-border bg-natural-0 px-4 py-3">
      <p className="text-xs leading-5 text-portal-note-text">{label}</p>
      <p className="mt-1 text-lg font-semibold leading-7 text-secondary-500">
        {value}
      </p>
    </div>
  );
}

export default function PortalProjectsPage() {
  const [statusFilter, setStatusFilter] = useState("");
  const [page, setPage] = useState(1);

  const { data, isLoading, isError } = useGetPortalProjectsQuery({
    status: statusFilter || undefined,
    page,
    limit: PAGE_SIZE,
  });

  const projects = data?.data ?? [];
  const total = data?.total ?? 0;
  const totalPages = Math.ceil(total / PAGE_SIZE);
  const activeFilterLabel =
    STATUS_FILTERS.find((filter) => filter.value === statusFilter)?.label ??
    STATUS_FILTERS[0].label;

  return (
    <div className="flex flex-col gap-5" dir="rtl">
      <PortalPageIntro
        title="مشاريعي"
        description="تتبع جميع مشاريعك، راقب الحالة الحالية، واستعرض نسبة التقدم لكل مشروع ضمن نفس الهوية البصرية للبوابة."
        icon={FolderOpen}
        actions={
          <>
            <ProjectSummaryPill label="إجمالي المشاريع" value={total} />
            <ProjectSummaryPill
              label="العرض الحالي"
              value={activeFilterLabel}
            />
          </>
        }
      />

      <PortalSurfaceCard
        title="قائمة المشاريع"
        description="استخدم الفلاتر لتضييق العرض، ثم راجع حالة المشروع والتقدم ومدير المشروع والتواريخ الأساسية."
        icon={Activity}
        action={
          <div className="flex flex-wrap items-center justify-end gap-2">
            {STATUS_FILTERS.map((filter) => {
              const isActive = statusFilter === filter.value;

              return (
                <Button
                  key={filter.value}
                  type="button"
                  variant="ghost"
                  className={cn(
                    "h-12 rounded-2xl border-[1.5px] px-5 text-base font-medium shadow-none transition-colors",
                    isActive
                      ? "border-secondary-500 bg-secondary-500 text-white hover:bg-secondary-600 hover:text-white"
                      : "border-portal-card-border bg-white text-portal-icon hover:bg-badge-gray-bg hover:text-secondary-500",
                  )}
                  onClick={() => {
                    setStatusFilter(filter.value);
                    setPage(1);
                  }}
                >
                  {filter.label}
                </Button>
              );
            })}
          </div>
        }
      >
        {isLoading && (
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, index) => (
              <div
                key={index}
                className="grid gap-3 rounded-3xl border-[1.5px] border-portal-divider bg-portal-bg p-4 lg:grid-cols-[1.7fr_1fr_1.2fr_1fr_1fr_1fr]"
              >
                {Array.from({ length: 6 }).map((__, cellIndex) => (
                  <Skeleton key={cellIndex} className="h-6 w-full rounded-lg" />
                ))}
              </div>
            ))}
          </div>
        )}

        {isError && (
          <div className="rounded-3xl border-[1.5px] border-danger-200 bg-danger-100 px-5 py-6 text-center">
            <p className="text-base font-medium text-danger-700">
              حدث خطأ أثناء تحميل المشاريع.
            </p>
            <p className="mt-2 text-sm text-danger-600">
              يرجى المحاولة لاحقاً أو تحديث الصفحة.
            </p>
          </div>
        )}

        {!isLoading && !isError && projects.length === 0 && (
          <div className="flex min-h-56 flex-col items-center justify-center gap-3 rounded-3xl border-[1.5px] border-dashed border-portal-card-border bg-portal-bg px-6 py-10 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-badge-gray-bg">
              <FolderOpen className="h-8 w-8 text-secondary-500" />
            </div>
            <p className="text-lg font-medium text-natural-100">
              لا توجد مشاريع حالياً.
            </p>
            <p className="max-w-md text-sm leading-6 text-portal-note-text">
              ستظهر هنا جميع المشاريع المرتبطة بحسابك مع التقدم الحالي والتواريخ
              ومدير المشروع فور توفرها.
            </p>
          </div>
        )}

        {!isLoading && !isError && projects.length > 0 && (
          <div className="space-y-5">
            <Table className="min-w-230">
              <TableHeader className="[&_tr]:border-portal-divider">
                <TableRow className="hover:bg-transparent">
                  <TableHead className="h-14 px-5 text-right text-sm font-medium text-portal-note-text">
                    اسم المشروع
                  </TableHead>
                  <TableHead className="h-14 px-5 text-right text-sm font-medium text-portal-note-text">
                    الحالة
                  </TableHead>
                  <TableHead className="h-14 px-5 text-right text-sm font-medium text-portal-note-text">
                    التقدم
                  </TableHead>
                  <TableHead className="h-14 px-5 text-right text-sm font-medium text-portal-note-text">
                    مدير المشروع
                  </TableHead>
                  <TableHead className="h-14 px-5 text-right text-sm font-medium text-portal-note-text">
                    تاريخ البداية
                  </TableHead>
                  <TableHead className="h-14 px-5 text-right text-sm font-medium text-portal-note-text">
                    تاريخ النهاية
                  </TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {projects.map((project) => (
                  <TableRow
                    key={project.id}
                    className="border-portal-divider hover:bg-black/3"
                  >
                    <TableCell className="px-5 py-5">
                      <div className="space-y-1">
                        <p className="text-base font-semibold text-natural-100">
                          {project.name}
                        </p>
                        <p className="text-sm text-portal-note-text">
                          مشروع ضمن عرض {activeFilterLabel}
                        </p>
                      </div>
                    </TableCell>

                    <TableCell className="px-5 py-5">
                      <StatusBadge
                        status={mapProjectStatusToUI(project.status)}
                        label={project.statusAr}
                      />
                    </TableCell>

                    <TableCell className="px-5 py-5">
                      <div className="flex min-w-45 items-center gap-3">
                        <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-gauge-track">
                          <div
                            className="h-full rounded-full bg-gauge-fill"
                            style={{ width: `${project.progress}%` }}
                          />
                        </div>
                        <span className="text-sm font-medium text-secondary-500">
                          {project.progress}%
                        </span>
                      </div>
                    </TableCell>

                    <TableCell className="px-5 py-5 text-sm text-portal-note-text">
                      {project.projectManager?.name ?? "غير معين"}
                    </TableCell>

                    <TableCell className="px-5 py-5 text-sm text-portal-note-text">
                      {new Date(project.startDate).toLocaleDateString(
                        "ar-SA-u-nu-latn",
                      )}
                    </TableCell>

                    <TableCell className="px-5 py-5 text-sm text-portal-note-text">
                      {new Date(project.endDate).toLocaleDateString(
                        "ar-SA-u-nu-latn",
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            {totalPages > 1 && (
              <div className="flex flex-wrap items-center justify-center gap-3 border-t-[1.5px] border-portal-divider pt-5">
                <Button
                  type="button"
                  variant="ghost"
                  className="h-12 rounded-2xl border-[1.5px] border-portal-card-border bg-white px-5 text-base font-medium text-portal-icon hover:bg-badge-gray-bg disabled:opacity-50"
                  disabled={page <= 1}
                  onClick={() => setPage((currentPage) => currentPage - 1)}
                >
                  السابق
                </Button>

                <div className="rounded-2xl border-[1.5px] border-portal-card-border bg-portal-bg px-5 py-3 text-sm font-medium text-secondary-500">
                  {page} من {totalPages}
                </div>

                <Button
                  type="button"
                  variant="ghost"
                  className="h-12 rounded-2xl border-[1.5px] border-portal-card-border bg-white px-5 text-base font-medium text-portal-icon hover:bg-badge-gray-bg disabled:opacity-50"
                  disabled={page >= totalPages}
                  onClick={() => setPage((currentPage) => currentPage + 1)}
                >
                  التالي
                </Button>
              </div>
            )}
          </div>
        )}
      </PortalSurfaceCard>
    </div>
  );
}
