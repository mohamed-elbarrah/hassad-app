"use client";

import { useMemo, useState } from "react";
import { Search, LayoutGrid, Columns3 } from "lucide-react";
import { Input } from "@/components/design-system/Input";
import { Skeleton as DSSkeleton } from "@/components/design-system/Skeleton";
import { Pagination } from "@/components/design-system/Pagination";
import { FilterBar, type FilterGroup } from "@/components/design-system/FilterBar";
import { ProjectCard } from "@/components/dashboard/pm/ProjectCard";
import { ProjectKanbanBoard } from "@/components/dashboard/pm/ProjectKanbanBoard";
import { ProjectForm } from "@/components/dashboard/pm/ProjectForm";
import { useGetProjectsQuery } from "@/features/projects/projectsApi";
import { useAppSelector } from "@/lib/hooks";
import {
  PROJECT_STATUS_LABELS,
} from "@/lib/utils/project-status";
import { ProjectStatus } from "@hassad/shared";
import {
  Tabs,
  TabsList,
  TabsTrigger,
} from "@/components/design-system/Tabs";
import { PageIntro } from "@/components/design-system/PageIntro";
import { PmEmptyState } from "@/components/dashboard/pm/shared/PmEmptyState";
import { FolderKanban } from "lucide-react";

// ── Page ──────────────────────────────────────────────────────────────────────

const PAGE_SIZE = 12;

export default function ProjectsPage() {
  const { user } = useAppSelector((state) => state.auth);
  const [search, setSearch] = useState("");
  const [view, setView] = useState<"kanban" | "cards">("kanban");
  const [page, setPage] = useState(1);
  const [activeFilters, setActiveFilters] = useState<Record<string, string[]>>({
    status: [],
  });

  // Fetch all projects for kanban + counting; cards view is paginated
  const { data: allData } = useGetProjectsQuery(
    {
      projectManagerId: user?.role === "PM" ? user.id : undefined,
      limit: 100,
    },
    { skip: !user },
  );

  const statusFilters = activeFilters.status ?? [];
  const effectiveStatus =
    statusFilters.length === 1 ? (statusFilters[0] as ProjectStatus) : undefined;

  const { data, isLoading, isError } = useGetProjectsQuery(
    {
      search: search || undefined,
      status: effectiveStatus,
      projectManagerId: user?.role === "PM" ? user.id : undefined,
      page: view === "cards" ? page : undefined,
      limit: view === "cards" ? PAGE_SIZE : 100,
    },
    { skip: !user },
  );

  // Derive status counts from all-data for the filter bar
  const filterGroups: FilterGroup[] = useMemo(() => {
    const counts = new Map<ProjectStatus, number>();
    Object.values(ProjectStatus).forEach((s) => counts.set(s, 0));
    (allData?.items ?? []).forEach((p) => {
      const s = p.status as ProjectStatus;
      counts.set(s, (counts.get(s) ?? 0) + 1);
    });

    return [
      {
        key: "status",
        label: "الحالة",
        options: Object.values(ProjectStatus).map((s) => ({
          label: PROJECT_STATUS_LABELS[s],
          value: s,
          count: counts.get(s) ?? 0,
        })),
      },
    ];
  }, [allData]);

  const totalPages = data?.totalPages ?? 1;

  if (!user) return null;

  return (
    <div className="flex flex-col gap-5" dir="rtl">
      <PageIntro
        title="المشاريع"
        description="إدارة ومتابعة جميع المشاريع تحت إدارتك"
        icon={FolderKanban}
        actions={<ProjectForm currentUserId={user.id} />}
      />

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex-1">
          <Input
            placeholder="ابحث عن مشروع..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            icon={<Search className="size-4 text-portal-note-text" />}
          />
        </div>

        <FilterBar
          groups={filterGroups}
          activeFilters={activeFilters}
          onFilterChange={(key, values) => {
            setActiveFilters((prev) => ({ ...prev, [key]: values }));
            setPage(1);
          }}
        />

        {/* View toggle */}
        <Tabs
          value={view}
          onValueChange={(v) => {
            setView(v as "kanban" | "cards");
            setPage(1);
          }}
        >
          <TabsList className="h-9">
            <TabsTrigger value="kanban" className="gap-1.5 text-xs">
              <Columns3 className="size-3.5" />
              كانبان
            </TabsTrigger>
            <TabsTrigger value="cards" className="gap-1.5 text-xs">
              <LayoutGrid className="size-3.5" />
              بطاقات
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Content */}
      {view === "kanban" && (
        <ProjectKanbanBoard
          projectManagerId={user.role === "PM" ? user.id : undefined}
          search={search || undefined}
          status={effectiveStatus}
        />
      )}

      {view === "cards" && isLoading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <DSSkeleton key={i} className="h-48 rounded-lg" />
          ))}
        </div>
      )}

      {view === "cards" && isError && (
        <PmEmptyState
          icon={FolderKanban}
          title="حدث خطأ أثناء تحميل المشاريع"
          description="يرجى تحديث الصفحة والمحاولة مرة أخرى."
        />
      )}

      {view === "cards" && !isLoading && !isError && data && (
        <>
          {data.items.length === 0 ? (
            <PmEmptyState
              icon={FolderKanban}
              title="لا توجد مشاريع"
              description="ابدأ بإنشاء مشروع جديد من خلال زر مشروع جديد"
            />
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {data.items.map((project) => (
                  <ProjectCard key={project.id} project={project} />
                ))}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-center pt-4">
                  <Pagination
                    page={page}
                    totalPages={totalPages}
                    onPageChange={setPage}
                  />
                </div>
              )}
            </>
          )}
        </>
      )}
    </div>
  );
}
