"use client";

import { useState } from "react";
import { Search } from "lucide-react";
import { Input } from "@/components/design-system/Input";
import { Select, SelectItem } from "@/components/design-system/Select";
import { Skeleton as DSSkeleton } from "@/components/design-system/Skeleton";
import { ProjectCard } from "@/components/dashboard/pm/ProjectCard";
import { ProjectKanbanBoard } from "@/components/dashboard/pm/ProjectKanbanBoard";
import { ProjectForm } from "@/components/dashboard/pm/ProjectForm";
import { useGetProjectsQuery } from "@/features/projects/projectsApi";
import { useAppSelector } from "@/lib/hooks";
import { ProjectStatus } from "@hassad/shared";

// ── Status filter labels ──────────────────────────────────────────────────────

const STATUS_LABELS: Record<ProjectStatus, string> = {
  [ProjectStatus.PLANNING]: "تخطيط",
  [ProjectStatus.ACTIVE]: "نشط",
  [ProjectStatus.ON_HOLD]: "موقوف",
  [ProjectStatus.AWAITING_REVIEW]: "بانتظار المراجعة",
  [ProjectStatus.NEEDS_REVISION]: "مطلوب تعديلات",
  [ProjectStatus.COMPLETED]: "مكتمل",
  [ProjectStatus.CANCELLED]: "ملغى",
};

// ── Page ──────────────────────────────────────────────────────────────────────

export default function ProjectsPage() {
  const { user } = useAppSelector((state) => state.auth);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<ProjectStatus | "all">(
    "all",
  );
  const [view, setView] = useState<"kanban" | "cards">("kanban");

  const { data, isLoading, isError } = useGetProjectsQuery({
    search: search || undefined,
    status:
      statusFilter === "all" ? undefined : (statusFilter as ProjectStatus),
    projectManagerId: user?.role === "PM" ? user.id : undefined,
    limit: 100,
  }, {
    skip: view !== "cards",
  });

  if (!user) return null;

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <h1 className="text-3xl font-bold tracking-tight">المشاريع</h1>
        <ProjectForm currentUserId={user.id} />
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex-1">
          <Input
            placeholder="ابحث عن مشروع..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            icon={<Search className="size-4 text-neutral-300" />}
          />
        </div>
        <Select
          value={statusFilter}
          onValueChange={(v) => setStatusFilter(v as ProjectStatus | "all")}
          placeholder="كل الحالات"
          triggerClassName="w-full sm:w-44"
        >
          <SelectItem value="all">كل الحالات</SelectItem>
          {Object.values(ProjectStatus).map((s) => (
            <SelectItem key={s} value={s}>
              {STATUS_LABELS[s]}
            </SelectItem>
          ))}
        </Select>
        <div className="flex rounded-md border p-1 gap-1">
          <button
            type="button"
            onClick={() => setView("kanban")}
            className={`px-3 py-1.5 text-sm rounded ${
              view === "kanban"
                ? "bg-secondary-500 text-white"
                : "text-neutral-300"
            }`}
          >
            كانبان
          </button>
          <button
            type="button"
            onClick={() => setView("cards")}
            className={`px-3 py-1.5 text-sm rounded ${
              view === "cards"
                ? "bg-secondary-500 text-white"
                : "text-neutral-300"
            }`}
          >
            بطاقات
          </button>
        </div>
      </div>

      {view === "kanban" && (
        <ProjectKanbanBoard
          projectManagerId={user.role === "PM" ? user.id : undefined}
          search={search || undefined}
          status={
            statusFilter === "all"
              ? undefined
              : (statusFilter as ProjectStatus)
          }
        />
      )}

      {/* Content */}
      {view === "cards" && isLoading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <DSSkeleton key={i} className="h-48 rounded-lg" />
          ))}
        </div>
      )}

      {view === "cards" && isError && (
        <p className="text-danger-500 text-sm">
          حدث خطأ أثناء تحميل المشاريع. يرجى تحديث الصفحة.
        </p>
      )}

      {view === "cards" && !isLoading && !isError && data && (
        <>
          {data.items.length === 0 ? (
            <div className="text-center py-16 text-neutral-300">
              <p className="text-lg font-medium">لا توجد مشاريع</p>
              <p className="text-sm mt-1">ابدأ بإنشاء مشروع جديد</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {data.items.map((project) => (
                <ProjectCard key={project.id} project={project} />
              ))}
            </div>
          )}
          <p className="text-xs text-neutral-300">
            إجمالي {data.total} مشروع
          </p>
        </>
      )}
    </div>
  );
}
