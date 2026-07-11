"use client";

import { PORTAL_POLLING_INTERVAL_MS } from "@/lib/constants";
import { useEffect, useMemo, useState, useCallback } from "react";
import { toast } from "sonner";
import { useSearchParams } from "next/navigation";
import { Eye } from "lucide-react";
import Link from "next/link";
import { useAppSelector } from "@/lib/hooks";
import {
  useGetReviewProjectsQuery,
  useGetProjectReviewDetailQuery,
  type ReviewProject,
} from "@/features/portal/portalApi";
import { PageIntro } from "@/components/design-system/PageIntro";
import { DataTable } from "@/components/design-system/DataTable";
import { ActionButton } from "@/components/design-system/ActionButton";
import { EmptyState, ErrorState } from "@/components/design-system/EmptyState";
import {
  renderProjectRowCells,
  ReviewModal,
  Toolbar,
} from "@/components/portal/deliverables";

/**
 * Page architecture (page IS the queue):
 *
 *   PageIntro        ← context (one line)
 *   Toolbar          ← search + status filter + count
 *   DataTable        ← the queue
 *   ReviewModal      ← the decision moment
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
    pollingInterval: PORTAL_POLLING_INTERVAL_MS,
  });

  const [search, setSearch] = useState("");
  const [activeFilters, setActiveFilters] = useState<Record<string, string[]>>(
    {},
  );
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(
    null,
  );

  // Deep-link `?focus=<id>` — opens the modal for that project.
  const searchParams = useSearchParams();
  useEffect(() => {
    const focus = searchParams?.get("focus");
    if (!focus || selectedProjectId === focus) return;
    setSelectedProjectId(focus);
    if (typeof window !== "undefined") {
      window.history.replaceState({}, "", window.location.pathname);
    }
  }, [searchParams, selectedProjectId]);

  const { data: selectedProject } = useGetProjectReviewDetailQuery(
    selectedProjectId!,
    { skip: !selectedProjectId, pollingInterval: PORTAL_POLLING_INTERVAL_MS },
  );

  const fallbackProject = useMemo<ReviewProject | undefined>(
    () => reviewProjects?.find((p) => p.id === selectedProjectId) ?? undefined,
    [reviewProjects, selectedProjectId],
  );

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

  const hasActiveSearchOrFilter =
    search.trim().length > 0 ||
    Object.values(activeFilters).some((v) => v.length > 0);

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

  const totalCount = reviewProjects?.length ?? 0;

  return (
    <div className="flex flex-col gap-5" dir="rtl">
      <PageIntro
        title="مراجعة المشاريع"
        description="راجع أعمال فريقك ووافق عليها أو اطلب تعديلات."
        icon={Eye}
      />

      {isError ? (
        <ErrorState onRetry={() => refetch()} />
      ) : totalCount === 0 && !isLoading ? (
        <EmptyState
          icon={Eye}
          title="كل مشاريعك تمت مراجعتها!"
          hint="لا يوجد حالياً أي مشروع بانتظار قرارك. سنُعلمك فور تسليم مشروع جديد للمراجعة."
          tone="success"
          action={
            <Link href="/portal/projects">
              <ActionButton variant="primary" size="lg">
                عرض كل مشاريعي
              </ActionButton>
            </Link>
          }
        />
      ) : (
        <>
          <Toolbar
            search={search}
            onSearchChange={setSearch}
            activeFilters={activeFilters}
            onFilterChange={(k, v) =>
              setActiveFilters((prev) => ({ ...prev, [k]: v }))
            }
            totalCount={totalCount}
            visibleCount={filtered.length}
            projects={reviewProjects}
          />

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
              message: hasActiveSearchOrFilter
                ? "لا توجد نتائج مطابقة"
                : "لا توجد مشاريع بانتظار المراجعة.",
              hint: hasActiveSearchOrFilter
                ? "جرّب كلمات بحث مختلفة أو امسح عوامل التصفية."
                : "ستظهر هنا المشاريع عندما يقدمها فريقك.",
            }}
            onRowActivate={(p: ReviewProject) => handleSelect(p.id)}
            renderCells={(p: ReviewProject, { onActivate }) =>
              renderProjectRowCells(
                p,
                { project: p, onSelect: handleSelect },
                { onActivate },
              )
            }
          />
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
