"use client";

import { useMemo, useState } from "react";
import { useGetPmRevisionsQuery } from "@/features/projects/projectsApi";
import type { PmDeliverableWithRevisions } from "@/features/projects/projectsApi";
import { useAppSelector } from "@/lib/hooks";
import { SurfaceCard } from "@/components/design-system/SurfaceCard";
import { Skeleton as DSSkeleton } from "@/components/design-system/Skeleton";
import { StatCard } from "@/components/design-system/StatCard";
import { formatShortDate } from "@/lib/format";
import {
  ClipboardList,
  FolderKanban,
  AlertCircle,
  CheckCircle2,
  Clock,
  ArrowUpRight,
  MessageSquare,
  User,
} from "lucide-react";
import { PageIntro } from "@/components/design-system/PageIntro";
import { PmEmptyState } from "@/components/dashboard/pm/shared/PmEmptyState";
import { PmStatusBadge } from "@/components/dashboard/pm/shared/PmStatusBadge";
import { cn } from "@/lib/utils";
import Link from "next/link";

// ── Status filter type ───────────────────────────────────────────────────────

type RevisionFilter = "all" | "TODO" | "IN_PROGRESS" | "IN_REVIEW" | "REVISION" | "DONE";

const FILTER_TABS: { key: RevisionFilter; label: string }[] = [
  { key: "all", label: "الكل" },
  { key: "TODO", label: "معلّق" },
  { key: "IN_PROGRESS", label: "قيد التنفيذ" },
  { key: "IN_REVIEW", label: "قيد المراجعة" },
  { key: "REVISION", label: "يحتاج تعديل" },
  { key: "DONE", label: "منجز" },
];

// ── Component ─────────────────────────────────────────────────────────────────

export default function PMChangeRequestsPage() {
  const { user } = useAppSelector((state) => state.auth);
  const [filter, setFilter] = useState<RevisionFilter>("all");

  const {
    data: deliverables = [],
    isLoading,
    isError,
  } = useGetPmRevisionsQuery(undefined, {
    skip: user?.role !== "PM",
  });

  // ── Stats ───────────────────────────────────────────────────────────────
  const stats = useMemo(() => {
    let pending = 0;
    let inProgress = 0;
    let inReview = 0;
    let needsRevision = 0;
    let done = 0;

    deliverables.forEach((del) => {
      del.revisionRequests.forEach((rev) => {
        if (rev.status === "TODO") pending++;
        else if (rev.status === "IN_PROGRESS") inProgress++;
        else if (rev.status === "IN_REVIEW") inReview++;
        else if (rev.status === "REVISION") needsRevision++;
        else if (rev.status === "DONE") done++;
      });
    });

    return {
      pending,
      inProgress,
      inReview,
      needsRevision,
      done,
      total: pending + inProgress + inReview + needsRevision + done,
    };
  }, [deliverables]);

  // ── Filtered + grouped ──────────────────────────────────────────────────
  const groupedByProject = useMemo(() => {
    const filtered = deliverables
      .map((del) => ({
        ...del,
        revisionRequests:
          filter === "all"
            ? del.revisionRequests
            : del.revisionRequests.filter((rev) => rev.status === filter),
      }))
      .filter((del) => del.revisionRequests.length > 0);

    return filtered.reduce<
      Record<
        string,
        { projectName: string; projectId: string; deliverables: PmDeliverableWithRevisions[] }
      >
    >((acc, del) => {
      const projectId = del.project?.id ?? del.projectId;
      const projectName = del.project?.name ?? "مشروع غير معروف";
      if (!acc[projectId]) {
        acc[projectId] = { projectName, projectId, deliverables: [] };
      }
      acc[projectId].deliverables.push(del);
      return acc;
    }, {});
  }, [deliverables, filter]);

  const projectEntries = Object.entries(groupedByProject);

  return (
    <div className="flex flex-col gap-5" dir="rtl">
      <PageIntro
        title="طلبات التعديل"
        description="طلبات التعديل الواردة من العملاء على التسليمات في مشاريعك."
        icon={ClipboardList}
      />

      {/* ── Stats Overview ──────────────────────────────────────────────── */}
      {!isLoading && !isError && (
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
          <StatCard
            title="بانتظار المراجعة"
            value={stats.pending}
            icon={AlertCircle}
            variant={stats.pending > 0 ? "warning" : "default"}
          />
          <StatCard
            title="قيد التنفيذ"
            value={stats.inProgress}
            icon={Clock}
            variant="default"
          />
          <StatCard
            title="قيد المراجعة"
            value={stats.inReview}
            icon={MessageSquare}
            variant="default"
          />
          <StatCard
            title="يحتاج تعديل"
            value={stats.needsRevision}
            icon={AlertCircle}
            variant={stats.needsRevision > 0 ? "danger" : "default"}
          />
          <StatCard
            title="منجزة"
            value={stats.done}
            icon={CheckCircle2}
            variant="success"
          />
        </div>
      )}

      {/* ── Loading ──────────────────────────────────────────────────────── */}
      {isLoading && (
        <SurfaceCard>
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <DSSkeleton key={i} className="h-16 w-full rounded-xl" />
            ))}
          </div>
        </SurfaceCard>
      )}

      {/* ── Error ───────────────────────────────────────────────────────── */}
      {isError && (
        <SurfaceCard className="border-danger-200 bg-danger-50/30">
          <div className="flex items-center gap-3 text-sm text-danger-600">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <span>حدث خطأ أثناء تحميل طلبات التعديل. يرجى المحاولة لاحقاً.</span>
          </div>
        </SurfaceCard>
      )}

      {/* ── Content ─────────────────────────────────────────────────────── */}
      {!isLoading && !isError && (
        <>
          {stats.total === 0 ? (
            <SurfaceCard>
              <PmEmptyState
                icon={ClipboardList}
                title="لا توجد طلبات تعديل"
                description="لم يقدم العملاء أي طلبات تعديل على التسليمات بعد."
              />
            </SurfaceCard>
          ) : (
            <>
              {/* Filter Tabs */}
              <div className="flex items-center gap-2 flex-wrap">
                {FILTER_TABS.map((tab) => {
                  const count =
                    tab.key === "all"
                      ? stats.total
                      : tab.key === "TODO"
                        ? stats.pending
                        : tab.key === "IN_PROGRESS"
                          ? stats.inProgress
                          : tab.key === "IN_REVIEW"
                            ? stats.inReview
                            : tab.key === "REVISION"
                              ? stats.needsRevision
                              : stats.done;

                  if (tab.key !== "all" && count === 0) return null;

                  return (
                    <button
                      key={tab.key}
                      onClick={() => setFilter(tab.key)}
                      className={cn(
                        "px-3 py-1.5 text-sm rounded-lg transition-colors font-medium",
                        filter === tab.key
                          ? "bg-secondary-500 text-white shadow-sm"
                          : "bg-badge-gray-bg text-portal-note-text hover:bg-badge-gray-bg/80",
                      )}
                    >
                      {tab.label} ({count})
                    </button>
                  );
                })}
              </div>

              {/* Project Groups */}
              <div className="space-y-5">
                {projectEntries.map(([projectId, group]) => (
                  <SurfaceCard
                    key={projectId}
                    title={group.projectName}
                    icon={FolderKanban}
                    action={
                      <Link
                        href={`/dashboard/pm/projects/${projectId}`}
                        className="text-sm text-secondary-500 hover:text-secondary-600 flex items-center gap-1"
                      >
                        عرض المشروع
                        <ArrowUpRight className="w-4 h-4" />
                      </Link>
                    }
                  >
                    <div className="space-y-4">
                      {group.deliverables.map((deliverable) => (
                        <DeliverableRevisions
                          key={deliverable.id}
                          deliverable={deliverable}
                          projectId={projectId}
                        />
                      ))}
                    </div>
                  </SurfaceCard>
                ))}
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
}

// ── Sub-component ─────────────────────────────────────────────────────────────

function DeliverableRevisions({
  deliverable,
  projectId,
}: {
  deliverable: PmDeliverableWithRevisions;
  projectId: string;
}) {
  return (
    <div className="border border-portal-card-border rounded-xl overflow-hidden">
      {/* Deliverable header */}
      <div className="bg-badge-gray-bg px-4 py-3 border-b border-portal-divider flex items-center justify-between">
        <div>
          <h3 className="font-medium text-sm text-natural-100">
            {deliverable.title}
          </h3>
          {deliverable.description && (
            <p className="text-xs text-portal-note-text mt-0.5 line-clamp-1">
              {deliverable.description}
            </p>
          )}
        </div>
        <div className="flex items-center gap-2 shrink-0 mr-3">
          <PmStatusBadge
            domain="revision"
            status={deliverable.status}
            className="text-xs"
          />
          <span className="text-xs text-portal-note-text">
            {deliverable.revisionRequests.length} طلب
          </span>
        </div>
      </div>

      {/* Revision requests */}
      <div className="divide-y divide-portal-divider">
        {deliverable.revisionRequests.map((rev) => (
          <div
            key={rev.id}
            className="flex items-start justify-between px-4 py-3 text-sm gap-4 hover:bg-badge-gray-bg/50 transition-colors"
          >
            <div className="flex flex-col gap-1.5 min-w-0 flex-1">
              <p className="text-natural-100 text-sm leading-relaxed line-clamp-2">
                {rev.requestDescription}
              </p>
              <div className="flex items-center gap-3 text-xs text-portal-note-text flex-wrap">
                {rev.client?.companyName && (
                  <span className="flex items-center gap-1">
                    <User className="w-3 h-3" />
                    {rev.client.companyName}
                  </span>
                )}
                <span dir="ltr">{formatShortDate(rev.createdAt)}</span>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <PmStatusBadge
                domain="revision"
                status={rev.status}
                className="text-xs"
              />
              <Link
                href={`/dashboard/pm/projects/${projectId}`}
                className="p-1.5 rounded-lg text-portal-note-text hover:text-secondary-500 hover:bg-secondary-500/10 transition-colors"
                title="عرض المشروع"
              >
                <ArrowUpRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
