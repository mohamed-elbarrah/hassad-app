"use client";

import { useState } from "react";
import { Activity, FolderOpen } from "lucide-react";
import { useGetPortalProjectsQuery } from "@/features/portal/portalApi";
import { ProjectStatus } from "@hassad/shared";
import { ActionButton } from "@/components/design-system/ActionButton";
import { PageIntro } from "@/components/design-system/PageIntro";
import { SurfaceCard } from "@/components/design-system/SurfaceCard";
import { Pagination } from "@/components/design-system/Pagination";
import { DataTable } from "@/components/design-system/DataTable";
import { StatusBadge } from "@/components/design-system/StatusBadge";
import { mapProjectStatusToUI } from "@/lib/utils/statusMapping";
import { cn } from "@/lib/utils";

const STATUS_FILTERS: { label: string; value: string }[] = [
  { label: "الكل", value: "" },
  { label: "نشط", value: ProjectStatus.ACTIVE },
  { label: "تخطيط", value: ProjectStatus.PLANNING },
  { label: "معلق", value: ProjectStatus.ON_HOLD },
  { label: "بانتظار المراجعة", value: ProjectStatus.AWAITING_REVIEW },
  { label: "مطلوب تعديلات", value: ProjectStatus.NEEDS_REVISION },
  { label: "مكتمل", value: ProjectStatus.COMPLETED },
  { label: "ملغى", value: ProjectStatus.CANCELLED },
];

const PAGE_SIZE = 6;

export default function PortalProjectsPage() {
  const [statusFilter, setStatusFilter] = useState("");
  const [page, setPage] = useState(1);

  const { data, isLoading, isError } = useGetPortalProjectsQuery({
    status: statusFilter || undefined,
    page,
    limit: PAGE_SIZE,
  }, { pollingInterval: 30_000 });

  const projects = data?.data ?? [];
  const total = data?.total ?? 0;
  const totalPages = Math.ceil(total / PAGE_SIZE);
  const activeFilterLabel =
    STATUS_FILTERS.find((filter) => filter.value === statusFilter)?.label ??
    STATUS_FILTERS[0].label;

  return (
    <div className="flex flex-col gap-5" dir="rtl">
      <PageIntro
        title="مشاريعي"
        description="تتبع جميع مشاريعك، راقب الحالة الحالية، واستعرض نسبة التقدم لكل مشروع ضمن نفس الهوية البصرية للبوابة."
        icon={FolderOpen}
      />

      <SurfaceCard
        title="قائمة المشاريع"
        description="استخدم الفلاتر لتضييق العرض، ثم راجع حالة المشروع والتقدم ومدير المشروع والتواريخ الأساسية."
        icon={Activity}
        action={
          <div className="flex flex-wrap items-center justify-end gap-2">
            {STATUS_FILTERS.map((filter) => {
              const isActive = statusFilter === filter.value;

              return (
                <ActionButton
                  key={filter.value}
                  type="button"
                  variant={isActive ? "toggle-active" : "toggle-inactive"}
                  size="md"
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
                </ActionButton>
              );
            })}
          </div>
        }
      >
        <DataTable
          columns={[
            { id: "name", label: "اسم المشروع" },
            { id: "status", label: "الحالة" },
            { id: "progress", label: "التقدم" },
            { id: "manager", label: "مدير المشروع" },
            { id: "startDate", label: "تاريخ البداية" },
            { id: "endDate", label: "تاريخ النهاية" },
          ]}
          data={projects}
          isLoading={isLoading}
          isError={isError}
          errorMessage="حدث خطأ أثناء تحميل المشاريع."
          emptyState={{
            icon: FolderOpen,
            message: "لا توجد مشاريع حالياً.",
            hint: "ستظهر هنا جميع المشاريع المرتبطة بحسابك مع التقدم الحالي والتواريخ ومدير المشروع فور توفرها.",
          }}
          minWidth="min-w-[700px]"
          renderRow={(project) => (
            <tr
              key={project.id}
              className="border-b-[1.5px] border-portal-divider"
            >
              <td className="px-5 py-4">
                <div className="space-y-1">
                  <p className="text-sm font-medium text-natural-100">
                    {project.name}
                  </p>
                  <p className="text-xs text-portal-note-text">
                    مشروع ضمن عرض {activeFilterLabel}
                  </p>
                </div>
              </td>

              <td className="px-5 py-4">
                <StatusBadge
                  status={mapProjectStatusToUI(project.status)}
                  label={project.statusAr}
                />
              </td>

              <td className="px-5 py-4">
                <div className="flex min-w-[120px] items-center gap-3">
                  <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-gauge-track">
                    <div
                      className="h-full rounded-full bg-gauge-fill"
                      style={{ width: `${project.progress}%` }}
                    />
                  </div>
                  <span className="text-xs font-medium text-secondary-500">
                    {project.progress}%
                  </span>
                </div>
              </td>

              <td className="px-5 py-4 text-sm text-portal-note-text">
                {project.projectManager?.name ?? "غير معين"}
              </td>

              <td className="px-5 py-4 text-sm text-portal-note-text">
                {new Date(project.startDate).toLocaleDateString(
                  "ar-SA-u-nu-latn",
                )}
              </td>

              <td className="px-5 py-4 text-sm text-portal-note-text">
                {new Date(project.endDate).toLocaleDateString(
                  "ar-SA-u-nu-latn",
                )}
              </td>
            </tr>
          )}
        />

        {totalPages > 1 && (
          <Pagination
            page={page}
            totalPages={totalPages}
            onPageChange={setPage}
          />
        )}
      </SurfaceCard>
    </div>
  );
}
