"use client";

import { PORTAL_POLLING_INTERVAL_MS } from "@/lib/constants";
import { useState, useCallback } from "react";
import Link from "next/link";
import {
  FolderOpen,
  Search,
  Clock,
  User,
  Calendar,
  ExternalLink,
} from "lucide-react";
import { useGetPortalProjectsQuery } from "@/features/portal/portalApi";
import { ProjectStatus } from "@hassad/shared";
import { PageIntro } from "@/components/design-system/PageIntro";
import { Pagination } from "@/components/design-system/Pagination";
import { StatusBadge } from "@/components/design-system/StatusBadge";
import {
  FilterBar,
  type FilterGroup,
} from "@/components/design-system/FilterBar";
import { Input } from "@/components/design-system/Input";
import { ActionButton } from "@/components/design-system/ActionButton";
import { Skeleton } from "@/components/design-system/Skeleton";
import { mapProjectStatusToUI } from "@/lib/utils/statusMapping";
import { cn } from "@/lib/utils";

const STATUS_GROUPS: FilterGroup[] = [
  {
    key: "status",
    label: "الحالة",
    options: [
      { label: "الكل", value: "" },
      { label: "نشط", value: ProjectStatus.ACTIVE },
      { label: "تخطيط", value: ProjectStatus.PLANNING },
      { label: "معلق", value: ProjectStatus.ON_HOLD },
      { label: "بانتظار المراجعة", value: ProjectStatus.AWAITING_REVIEW },
      { label: "مطلوب تعديلات", value: ProjectStatus.NEEDS_REVISION },
      { label: "مكتمل", value: ProjectStatus.COMPLETED },
      { label: "ملغى", value: ProjectStatus.CANCELLED },
    ],
  },
];

const PAGE_SIZE = 9;

export default function PortalProjectsPage() {
  const [activeFilters, setActiveFilters] = useState<Record<string, string[]>>(
    {},
  );
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  const statusFilter = activeFilters["status"]?.[0] ?? "";

  const { data, isLoading, isError } = useGetPortalProjectsQuery(
    {
      status: statusFilter || undefined,
      page,
      limit: PAGE_SIZE,
    },
    { pollingInterval: PORTAL_POLLING_INTERVAL_MS },
  );

  const projects = data?.data ?? [];
  const total = data?.total ?? 0;
  const totalPages = Math.ceil(total / PAGE_SIZE);

  const handleFilterChange = useCallback(
    (groupKey: string, values: string[]) => {
      setActiveFilters((prev) => ({ ...prev, [groupKey]: values }));
      setPage(1);
    },
    [],
  );

  // Filter by search locally
  const filtered = search
    ? projects.filter((p) =>
        p.name.toLowerCase().includes(search.toLowerCase()),
      )
    : projects;

  return (
    <div className="flex flex-col gap-5" dir="rtl">
      <PageIntro
        title="مشاريعي"
        description="تتبع جميع مشاريعك، راقب الحالة الحالية، واستعرض نسبة التقدم لكل مشروع."
        icon={FolderOpen}
      />

      {/* ── Toolbar: Search + Filter ──────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row gap-3 items-start">
        <div className="relative flex-1">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 size-4 text-portal-icon" />
          <Input
            placeholder="ابحث عن مشروع..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="pr-9"
          />
        </div>
        <FilterBar
          groups={STATUS_GROUPS}
          activeFilters={activeFilters}
          onFilterChange={handleFilterChange}
        />
      </div>

      {/* ── Projects Grid ─────────────────────────────────────────────────── */}
      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-56 rounded-[30px]" />
          ))}
        </div>
      ) : isError ? (
        <div className="rounded-2xl border-[1.5px] border-danger-200 bg-danger-100 px-5 py-8 text-center">
          <p className="text-base font-medium text-danger-700">
            حدث خطأ أثناء تحميل المشاريع.
          </p>
          <p className="mt-2 text-sm text-danger-600">
            يرجى المحاولة لاحقاً أو تحديث الصفحة.
          </p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex min-h-56 flex-col items-center justify-center gap-3 rounded-2xl border-[1.5px] border-dashed border-portal-card-border bg-portal-bg px-6 py-10 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-badge-gray-bg">
            <FolderOpen className="h-8 w-8 text-secondary-500" />
          </div>
          <p className="text-lg font-medium text-natural-100">
            {search || statusFilter
              ? "لا توجد مشاريع تطابق بحثك"
              : "لا توجد مشاريع حالياً"}
          </p>
          <p className="max-w-md text-sm leading-6 text-portal-note-text">
            {search || statusFilter
              ? "حاول تغيير كلمة البحث أو إزالة الفلتر لعرض نتائج أكثر."
              : "ستظهر هنا جميع المشاريع المرتبطة بحسابك مع التقدم الحالي والتواريخ ومدير المشروع فور توفرها."}
          </p>
        </div>
      ) : (
        <>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {filtered.map((project) => (
              <div
                key={project.id}
                className="group relative flex flex-col rounded-[30px] border-[1.5px] border-portal-divider bg-natural-0 p-5 transition-all hover:border-secondary-500/30 hover:shadow-sm"
              >
                {/* Card Header */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <h3 className="text-base font-semibold text-natural-100 truncate group-hover:text-secondary-500 transition-colors">
                      {project.name}
                    </h3>
                    {project.projectManager && (
                      <div className="flex items-center gap-1.5 mt-1 text-xs text-portal-note-text">
                        <User className="h-3 w-3 shrink-0" />
                        <span className="truncate">
                          {project.projectManager.name}
                        </span>
                        <span
                          className={cn(
                            "inline-block h-1.5 w-1.5 rounded-full",
                            project.projectManager.isOnline
                              ? "bg-success-500"
                              : "bg-neutral-200",
                          )}
                        />
                      </div>
                    )}
                  </div>
                  <StatusBadge
                    status={mapProjectStatusToUI(project.status)}
                    label={project.statusAr}
                  />
                </div>

                {/* Spacer */}
                <div className="mt-4 flex-1">
                  {/* Progress */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-portal-note-text">
                        نسبة الإنجاز
                      </span>
                      <span className="font-medium text-secondary-500">
                        {project.progress}%
                      </span>
                    </div>
                    <div className="h-2.5 w-full overflow-hidden rounded-full bg-gauge-track">
                      <div
                        className="h-full rounded-full bg-gauge-fill transition-all duration-500"
                        style={{ width: `${project.progress}%` }}
                      />
                    </div>
                  </div>

                  {/* Dates */}
                  <div className="mt-4 flex items-center gap-4 text-xs text-portal-note-text">
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3.5 w-3.5" />
                      {new Date(project.startDate).toLocaleDateString(
                        "ar-SA-u-nu-latn",
                      )}
                    </span>
                    <span className="text-portal-divider">—</span>
                    <span className="flex items-center gap-1">
                      <Clock className="h-3.5 w-3.5" />
                      {new Date(project.endDate).toLocaleDateString(
                        "ar-SA-u-nu-latn",
                      )}
                    </span>
                  </div>
                </div>

                {/* Card Footer */}
                <div className="mt-4 pt-3 border-t border-portal-divider">
                  <Link href={`/portal/projects/${project.id}`}>
                    <ActionButton
                      variant="outline"
                      size="sm"
                      className="w-full h-9 rounded-xl border-[1.5px] border-portal-card-border text-xs font-medium text-portal-icon hover:bg-badge-gray-bg hover:text-secondary-500 gap-1"
                    >
                      <ExternalLink className="h-3.5 w-3.5" />
                      عرض الفترات
                    </ActionButton>
                  </Link>
                </div>
              </div>
            ))}
          </div>

          {/* ── Pagination ──────────────────────────────────────────────────── */}
          {totalPages > 1 && (
            <div className="flex justify-center mt-6">
              <Pagination
                page={page}
                totalPages={totalPages}
                onPageChange={setPage}
              />
            </div>
          )}
        </>
      )}
    </div>
  );
}
