"use client";

import { useState } from "react";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
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
        <h1 className="text-2xl font-semibold">المشاريع</h1>
        <ProjectForm currentUserId={user.id} />
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input
            placeholder="ابحث عن مشروع..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pr-9"
          />
        </div>
        <Select
          value={statusFilter}
          onValueChange={(v) => setStatusFilter(v as ProjectStatus | "all")}
        >
          <SelectTrigger className="w-full sm:w-44">
            <SelectValue placeholder="كل الحالات" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">كل الحالات</SelectItem>
            {Object.values(ProjectStatus).map((s) => (
              <SelectItem key={s} value={s}>
                {STATUS_LABELS[s]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <div className="flex rounded-md border p-1 gap-1">
          <button
            type="button"
            onClick={() => setView("kanban")}
            className={`px-3 py-1.5 text-sm rounded ${
              view === "kanban"
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground"
            }`}
          >
            كانبان
          </button>
          <button
            type="button"
            onClick={() => setView("cards")}
            className={`px-3 py-1.5 text-sm rounded ${
              view === "cards"
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground"
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
            <Skeleton key={i} className="h-48 rounded-lg" />
          ))}
        </div>
      )}

      {view === "cards" && isError && (
        <p className="text-destructive text-sm">
          حدث خطأ أثناء تحميل المشاريع. يرجى تحديث الصفحة.
        </p>
      )}

      {view === "cards" && !isLoading && !isError && data && (
        <>
          {data.items.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground">
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
          <p className="text-xs text-muted-foreground">
            إجمالي {data.total} مشروع
          </p>
        </>
      )}
    </div>
  );
}
