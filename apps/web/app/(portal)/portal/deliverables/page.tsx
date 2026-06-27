"use client";

import { useEffect, useMemo, useState, useCallback } from "react";
import { toast } from "sonner";
import { useSearchParams } from "next/navigation";
import { AlertOctagon, Eye } from "lucide-react";
import { useAppSelector } from "@/lib/hooks";
import {
  useGetReviewProjectsQuery,
  useGetProjectReviewDetailQuery,
  type ReviewProject,
} from "@/features/portal/portalApi";
import { PageIntro } from "@/components/design-system/PageIntro";
import { DataTable } from "@/components/design-system/DataTable";
import { ActionButton } from "@/components/design-system/ActionButton";
import {
  ProjectRow,
  ReviewModal,
  Toolbar,
  EmptyState,
} from "@/components/portal/deliverables";

/**
 * Page architecture (no KPI strip, no SurfaceCard wrapper):
 *
 *   PageIntro        ← context (one line)
 *   Toolbar          ← search + status filter + count
 *   DataTable        ← the queue
 *   (empty/error)    ← real UX, not decorative
 *
 * That's it. The page IS the queue.
 */
export default function PortalDeliverablesPage() {
  const { user } = useAppSelector((state) => state.auth);
  const clientId = user?.clientId ?? "";

  const {
    data: reviewProjects,
    isLoading,
    isError,
    refetch,
  } = useGetReviewProjectsQuery(undefined, {
    skip: !clientId,
    pollingInterval: 120_000,
  });

  const [search, setSearch] = useState("");
  const [activeFilters, setActiveFilters] = useState<Record<string, string[]>>(
    {},
  );
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(
    null,
  );

  // ── Deep-link `?focus=<id>` ──────────────────────────────────────────────
  const searchParams = useSearchParams();
  useEffect(() => {
    const focus = searchParams?.get("focus");
    if (!focus || selectedProjectId === focus) return;
    setSelectedProjectId(focus);
    if (typeof window !== "undefined") {
      window.history.replaceState({}, "", window.location.pathname);
    }
  }, [searchParams, selectedProjectId]);

  // ── Selected project detail (polled while modal is open) ─────────────────
  const { data: selectedProject } = useGetProjectReviewDetailQuery(
    selectedProjectId!,
    { skip: !selectedProjectId, pollingInterval: 120_000 },
  );

  const fallbackProject = useMemo<ReviewProject | undefined>(
    () => reviewProjects?.find((p) => p.id === selectedProjectId) ?? undefined,
    [reviewProjects, selectedProjectId],
  );

  // ── Client-side filter (search + status) ─────────────────────────────────
  const filtered = useMemo(() => {
    if (!reviewProjects) return [];
    const q = search.trim().toLowerCase();
    const statusFilter = activeFilters["status"]?.[0];

    return reviewProjects.filter((p) => {
      if (statusFilter && p.status !== statusFilter) return false;
      if (!q) return true;
      return (
        p.name.toLowerCase().includes(q) ||
        (p.description?.toLowerCase().includes(q) ?? false) ||
        (p.manager?.name.toLowerCase().includes(q) ?? false)
      );
    });
  }, [reviewProjects, search, activeFilters]);

  // ── Filter groups (status options derived from what actually exists) ────
  const filterGroups = useMemo(
    () => buildFilterGroups(reviewProjects),
    [reviewProjects],
  );

  const hasActiveSearchOrFilter =
    search.trim().length > 0 ||
    Object.values(activeFilters).some((v) => v.length > 0);

  // ── Handlers ─────────────────────────────────────────────────────────────
  const handleSelect = useCallback((id: string) => {
    setSelectedProjectId(id);
  }, []);

  const handleModalChange = useCallback((open: boolean) => {
    if (!open) setSelectedProjectId(null);
  }, []);

  const handleActionComplete = useCallback(
    (handledProjectId: string) => {
      refetch().then(() => {
        setTimeout(() => {
          const next = (reviewProjects ?? []).find(
            (p) => p.id !== handledProjectId,
          );
          if (next) {
            toast("لا يزال هناك مشاريع بانتظار قرارك.", {
              description: next.name,
              action: {
                label: "افتح التالي",
                onClick: () => setSelectedProjectId(next.id),
              },
            });
          }
        }, 200);
      });
    },
    [refetch, reviewProjects],
  );

  // ── Render ───────────────────────────────────────────────────────────────
  if (!clientId) {
    return (
      <div className="flex flex-col gap-5" dir="rtl">
        <PageIntro
          title="مراجعة المشاريع"
          description="المشاريع الجاهزة للمراجعة والموافقة."
          icon={Eye}
        />
        <p className="text-sm text-portal-note-text">
          لم يتم ربط حسابك بملف عميل.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5" dir="rtl">
      <PageIntro
        title="مراجعة المشاريع"
        description="راجع أعمال فريقك ووافق عليها أو اطلب تعديلات."
        icon={Eye}
      />

      {isError ? (
        <ErrorState onRetry={() => refetch()} />
      ) : (reviewProjects?.length ?? 0) === 0 && !isLoading ? (
        <EmptyState
          hasActiveFilter={false}
          hasAnyProject={(reviewProjects?.length ?? 0) > 0}
        />
      ) : (
        <>
          <Toolbar
            search={search}
            onSearchChange={setSearch}
            filterGroups={filterGroups}
            activeFilters={activeFilters}
            onFilterChange={(k, v) =>
              setActiveFilters((prev) => ({ ...prev, [k]: v }))
            }
            totalCount={reviewProjects?.length ?? 0}
            visibleCount={filtered.length}
          />

          {filtered.length === 0 ? (
            <EmptyState hasActiveFilter={hasActiveSearchOrFilter} />
          ) : (
            <DataTable
              columns={[
                { id: "name", label: "المشروع" },
                { id: "files", label: "الملفات", align: "center" },
                { id: "manager", label: "المدير" },
                { id: "dates", label: "الفترة" },
                { id: "status", label: "الحالة" },
                { id: "action", label: "", align: "left", width: "110px" },
              ]}
              data={filtered}
              isLoading={isLoading}
              isError={false}
              skeletonRows={6}
              emptyState={{
                icon: Eye,
                message: "لا توجد مشاريع بانتظار المراجعة.",
                hint: "ستظهر هنا المشاريع عندما يقدمها فريقك.",
              }}
              renderRow={(p: ReviewProject) => (
                <ProjectRow
                  key={p.id}
                  project={p}
                  onSelect={handleSelect}
                />
              )}
            />
          )}
        </>
      )}

      <ReviewModal
        selectedProjectId={selectedProjectId}
        selectedProject={selectedProject}
        fallbackProject={fallbackProject}
        onActionComplete={handleActionComplete}
        onOpenChange={handleModalChange}
      />
    </div>
  );
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function buildFilterGroups(projects: ReviewProject[] | undefined) {
  const counts = new Map<string, number>();
  for (const p of projects ?? []) {
    counts.set(p.status, (counts.get(p.status) ?? 0) + 1);
  }

  const STATUS_LABEL: Record<string, string> = {
    AWAITING_REVIEW: "بانتظار المراجعة",
    IN_REVIEW: "قيد المراجعة",
    IN_PROGRESS: "قيد التنفيذ",
    NEEDS_REVISION: "مطلوب تعديلات",
    COMPLETED: "مكتمل",
    ACTIVE: "نشط",
    ON_HOLD: "معلق",
    CANCELLED: "ملغي",
    PLANNING: "تخطيط",
  };

  const options = [...counts.entries()]
    .sort(([, a], [, b]) => b - a)
    .map(([value, count]) => ({
      label: STATUS_LABEL[value] ?? value,
      value,
      count,
    }));

  return [
    {
      key: "status",
      label: "الحالة",
      options: [{ label: "الكل", value: "" }, ...options],
    },
  ];
}

// ─── Error state ─────────────────────────────────────────────────────────────

function ErrorState({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="flex min-h-[240px] flex-col items-center justify-center gap-3 rounded-3xl border-[1.5px] border-danger-200 bg-danger-100 px-6 py-10 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-danger-100">
        <AlertOctagon className="h-7 w-7 text-danger-600" />
      </div>
      <p className="text-base font-semibold text-natural-100">
        تعذّر تحميل المشاريع
      </p>
      <p className="text-sm text-portal-note-text max-w-md">
        قد تكون المشكلة في الاتصال. حاول مجدداً.
      </p>
      <ActionButton variant="primary" size="md" onClick={onRetry}>
        إعادة المحاولة
      </ActionButton>
    </div>
  );
}
