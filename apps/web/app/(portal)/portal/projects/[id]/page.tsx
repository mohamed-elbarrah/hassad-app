"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { toast } from "sonner";
import {
  AlertTriangle,
  Calendar,
  DollarSign,
  FileText,
  Megaphone,
  Paperclip,
  RefreshCw,
  Target,
  Users,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import {
  useGetPortalProjectDetailQuery,
  useGetPortalProjectPeriodsQuery,
  useLazyDownloadPeriodReportQuery,
  useLazyDownloadPeriodFileQuery,
  type PortalPeriodSummary,
  type PortalPeriodFile,
} from "@/features/portal/portalApi";
import { Skeleton } from "@/components/design-system/Skeleton";
import { SurfaceCard } from "@/components/design-system/SurfaceCard";
import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from "@/components/design-system/Tabs";
import {
  ProjectHeader,
  HeroCard,
  StatCards,
  GoalsTab,
  FilesTab,
  ReportsTab,
  CampaignsTab,
  MeetingsTab,
  InvoiceTab,
} from "@/components/portal/project-detail";
import { ProjectPeriodStatus } from "@hassad/shared";

interface TabDef {
  id: string;
  label: string;
  icon: LucideIcon;
}

const TABS: TabDef[] = [
  { id: "goals", label: "الأهداف", icon: Target },
  { id: "files", label: "الملفات", icon: Paperclip },
  { id: "reports", label: "التقارير", icon: FileText },
  { id: "campaigns", label: "الحملات", icon: Megaphone },
  { id: "meetings", label: "الاجتماعات", icon: Users },
  { id: "invoices", label: "الفواتير", icon: DollarSign },
];

/** Resolve the initially selected period (ACTIVE → first → null). */
function pickInitialPeriod(periods: PortalPeriodSummary[]): string | null {
  if (periods.length === 0) return null;
  const active = periods.find((p) => p.status === ProjectPeriodStatus.ACTIVE);
  return (active ?? periods[0]).id;
}

/**
 * Pick the most informative tab to land on for a given period.
 *
 * Priority order — chose these because each is a concrete artifact the
 * client can act on or review:
 *   1. reports   — PM-uploaded end-of-period deliverable (highest signal)
 *   2. invoices  — money owed / paid (high attention)
 *   3. meetings  — upcoming action items
 *   4. files     — uploaded artifacts
 *   5. goals     — the project's progress story
 *   6. fallback  — goals (matches the original default)
 *
 * Only ever called on first-load (see the auto-select effect below) so we
 * never yank the user's explicit tab choice away from them on subsequent
 * period switches.
 */
function pickInitialTab(period: PortalPeriodSummary): string {
  if (period.stats.hasReport) return "reports";
  if (period.invoice) return "invoices";
  if (period.meetings.length > 0) return "meetings";
  if (period.files.length > 0) return "files";
  return "goals";
}

export default function PortalProjectPeriodsPage() {
  const params = useParams();
  const projectId = params.id as string;

  const {
    data: project,
    isLoading: projectLoading,
    isError: projectError,
    refetch: refetchProject,
  } = useGetPortalProjectDetailQuery(projectId);
  const {
    data: periods,
    isLoading: periodsLoading,
    isError: periodsError,
    refetch: refetchPeriods,
  } = useGetPortalProjectPeriodsQuery(projectId);

  const [triggerReportDownload] = useLazyDownloadPeriodReportQuery();
  const [triggerFileDownload] = useLazyDownloadPeriodFileQuery();

  const [selectedPeriodId, setSelectedPeriodId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<string>("goals");

  // Reset client-side selection whenever the user navigates to a different
  // project. Next.js App Router reuses this component instance across
  // [id] changes, so without this reset the previously-selected periodId
  // leaks into the new project and `selectedPeriod` becomes null
  // (silent broken UI). See audit issue #2.
  useEffect(() => {
    setSelectedPeriodId(null);
    setActiveTab("goals");
  }, [projectId]);

  // Auto-select the active (or first) period once periods load, AND pick
  // the most informative initial tab for that period.
  //
  // Depends ONLY on `periods` — when the user explicitly picks a different
  // period we don't want to re-run this effect and override their tab.
  // (Audit issue #12, polish issue #1.)
  useEffect(() => {
    if (periods && periods.length > 0 && !selectedPeriodId) {
      const periodId = pickInitialPeriod(periods);
      const period = periods.find((p) => p.id === periodId);
      setSelectedPeriodId(periodId);
      if (period) setActiveTab(pickInitialTab(period));
    }
    // selectedPeriodId intentionally omitted — see comment above.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [periods]);

  const selectedPeriod =
    periods?.find((p) => p.id === selectedPeriodId) ?? null;

  // ── Download handlers ────────────────────────────────────────────────────

  /**
   * Open a presigned download URL in a new tab.
   * Centralized so every download surfaces a user-visible toast on failure
   * (audit issue #17 — silent broken downloads).
   */
  const openDownload = (url: string | undefined) => {
    if (url) {
      window.open(url, "_blank", "noopener,noreferrer");
      return true;
    }
    return false;
  };

  const downloadPeriodReport = async () => {
    if (!selectedPeriod) return;
    const res = await triggerReportDownload({
      projectId,
      periodId: selectedPeriod.id,
    });
    if (res.error) {
      toast.error("تعذّر تحميل التقرير", {
        description:
          "الملف لم يعد متوفراً. يرجى المحاولة لاحقاً أو التواصل مع مدير المشروع.",
      });
      return;
    }
    if (!openDownload(res.data?.url)) {
      toast.error("تعذّر تحميل التقرير");
    }
  };

  const downloadPeriodFile = async (file: PortalPeriodFile) => {
    if (!selectedPeriod) return;
    const res = await triggerFileDownload({
      projectId,
      periodId: selectedPeriod.id,
      fileId: file.id,
    });
    if (res.error) {
      toast.error("تعذّر تحميل الملف", {
        description:
          "الملف لم يعد متوفراً. يرجى المحاولة لاحقاً أو التواصل مع مدير المشروع.",
      });
      return;
    }
    if (!openDownload(res.data?.url)) {
      toast.error("تعذّر تحميل الملف");
    }
  };

  // ── Loading ────────────────────────────────────────────────────────────────

  if (periodsLoading || projectLoading) {
    return (
      <div className="flex flex-col gap-5" dir="rtl">
        <Skeleton className="h-12 w-full rounded-2xl" />
        <Skeleton className="h-48 w-full rounded-[30px]" />
        <Skeleton className="h-16 w-full rounded-2xl" />
        <Skeleton className="h-64 w-full rounded-[30px]" />
      </div>
    );
  }

  // ── Error ─────────────────────────────────────────────────────────────────
  // Without this branch a 403/404/500 is silently swallowed and the page
  // shows the “no periods yet” empty state. See audit issue #1.
  if (periodsError || projectError) {
    const handleRetry = () => {
      if (periodsError) void refetchPeriods();
      if (projectError) void refetchProject();
    };
    return (
      <div className="flex flex-col gap-6" dir="rtl">
        {project && <ProjectHeader project={project} />}
        <SurfaceCard>
          <div className="flex flex-col items-center gap-4 py-16 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-danger-100 text-danger-600">
              <AlertTriangle className="size-8" />
            </div>
            <p className="text-lg font-medium text-natural-100">
              تعذّر تحميل بيانات المشروع
            </p>
            <p className="max-w-md text-sm leading-6 text-portal-note-text">
              حدث خطأ أثناء الاتصال بالخادم. قد يكون المشروع غير متاح أو تم نقله
              إلى حساب آخر. يرجى المحاولة مرة أخرى.
            </p>
            <button
              onClick={handleRetry}
              className="inline-flex items-center gap-2 rounded-xl border border-portal-card-border bg-natural-0 px-4 py-2 text-sm font-medium text-portal-icon hover:bg-badge-gray-bg hover:text-secondary-500"
            >
              <RefreshCw className="size-4" />
              إعادة المحاولة
            </button>
          </div>
        </SurfaceCard>
      </div>
    );
  }

  // ── No periods yet ──────────────────────────────────────────────────────────

  if (!periods || periods.length === 0) {
    return (
      <div className="flex flex-col gap-6" dir="rtl">
        {project && <ProjectHeader project={project} />}
        <SurfaceCard>
          <div className="flex flex-col items-center gap-3 py-16 text-center text-portal-note-text">
            <Calendar className="size-12" />
            <p className="text-lg font-medium">لا توجد فترات بعد</p>
            <p className="text-sm">سيتم إنشاء الفترات بعد تفعيل العقد</p>
          </div>
        </SurfaceCard>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5" dir="rtl">
      {project && <ProjectHeader project={project} />}

      {selectedPeriod && (
        // Top section: HeroCard (60%) + StatCards (40%) side-by-side on
        // tablet+, stacked on mobile. The 5-column grid with col-span-3 /
        // col-span-2 split is the standard 60/40 pattern in Tailwind —
        // no magic numbers, no per-breakpoint overrides, no `grid-cols-12`
        // ceremony. `items-start` lets each card size to its own content
        // rather than stretching to match the other (UX polish #10).
        <div
          className="grid grid-cols-1 items-start gap-5 md:grid-cols-5"
          dir="rtl"
        >
          <div className="md:col-span-3">
            <HeroCard
              period={selectedPeriod}
              totalPeriods={periods.length}
              periods={periods}
              selectedPeriodId={selectedPeriod.id}
              onSelectPeriod={(period) => setSelectedPeriodId(period.id)}
              onDownloadReport={downloadPeriodReport}
              onViewInvoice={() => setActiveTab("invoices")}
            />
          </div>
          <div className="md:col-span-2">
            <StatCards stats={selectedPeriod.stats} />
          </div>
        </div>
      )}

      {selectedPeriod && (
        <Tabs
          value={activeTab}
          onValueChange={setActiveTab}
          dir="rtl"
          className="w-full"
        >
          <TabsList className="h-auto w-full flex-wrap justify-start overflow-x-auto sm:flex-nowrap">
            {TABS.map((tab) => {
              const Icon = tab.icon;
              return (
                <TabsTrigger
                  key={tab.id}
                  value={tab.id}
                  className="gap-2 py-2.5"
                >
                  <Icon className="size-4" />
                  {tab.label}
                </TabsTrigger>
              );
            })}
          </TabsList>

          <TabsContent value="goals" className="mt-4">
            <GoalsTab goals={selectedPeriod.goals} />
          </TabsContent>

          <TabsContent value="files" className="mt-4">
            <FilesTab
              files={selectedPeriod.files}
              onDownload={downloadPeriodFile}
            />
          </TabsContent>

          <TabsContent value="reports" className="mt-4">
            <ReportsTab
              period={selectedPeriod}
              onDownloadReport={downloadPeriodReport}
            />
          </TabsContent>

          <TabsContent value="campaigns" className="mt-4">
            <CampaignsTab projectId={projectId} periodId={selectedPeriod.id} />
          </TabsContent>

          <TabsContent value="meetings" className="mt-4">
            <MeetingsTab meetings={selectedPeriod.meetings} />
          </TabsContent>

          <TabsContent value="invoices" className="mt-4">
            <InvoiceTab invoice={selectedPeriod.invoice} />
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}
