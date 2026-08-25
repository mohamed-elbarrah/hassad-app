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
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  ProjectHeader,
  GoalsTab,
  FilesTab,
  ReportsTab,
  CampaignsTab,
  MeetingsTab,
  InvoiceTab,
} from "@/components/portal/project-detail";
import { ProjectPeriodStatus, PROJECT_STATUS_AR } from "@hassad/shared";
import { ProjectPeriodWorkspace } from "@/components/project-detail/ProjectPeriodWorkspace";
import { daysUntil, formatShortDate } from "@/lib/format";

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
      <main className="flex flex-col gap-6" dir="rtl">
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-48 w-full" />
        <Skeleton className="h-16 w-full" />
        <Skeleton className="h-64 w-full" />
      </main>
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
      <main className="flex flex-col gap-6" dir="rtl">
        {project && <ProjectHeader project={project} />}
        <Card>
          <CardContent className="pt-6">
            <Empty>
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <AlertTriangle className="size-8" />
                </EmptyMedia>
                <EmptyTitle>تعذّر تحميل بيانات المشروع</EmptyTitle>
                <EmptyDescription>
                  حدث خطأ أثناء الاتصال بالخادم. يرجى المحاولة مرة أخرى.
                </EmptyDescription>
              </EmptyHeader>
              <Button onClick={handleRetry}>
                <RefreshCw />
                إعادة المحاولة
              </Button>
            </Empty>
          </CardContent>
        </Card>
      </main>
    );
  }

  // ── No periods yet ──────────────────────────────────────────────────────────

  if (!periods || periods.length === 0) {
    return (
      <main className="flex flex-col gap-6" dir="rtl">
        {project && <ProjectHeader project={project} />}
        <Card>
          <CardContent className="pt-6">
            <Empty>
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <Calendar />
                </EmptyMedia>
                <EmptyTitle>لا توجد فترات بعد</EmptyTitle>
                <EmptyDescription>
                  سيتم إنشاء الفترات بعد تفعيل العقد.
                </EmptyDescription>
              </EmptyHeader>
            </Empty>
          </CardContent>
        </Card>
      </main>
    );
  }

  return (
    <main className="flex flex-col gap-6" dir="rtl">
      {project && <ProjectHeader project={project} />}

      {selectedPeriod && (
        <ProjectPeriodWorkspace
          role="client"
          periods={periods}
          selectedPeriodId={selectedPeriod.id}
          onSelectPeriod={(periodId) => setSelectedPeriodId(periodId)}
          overview={
            <div className="flex flex-col gap-5">
              <dl className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
                <div className="flex min-w-0 flex-col gap-1 border-b pb-3">
                  <dt className="text-xs text-muted-foreground">العميل</dt>
                  <dd className="truncate font-medium">{project?.client.companyName}</dd>
                </div>
                <div className="flex min-w-0 flex-col gap-1 border-b pb-3">
                  <dt className="text-xs text-muted-foreground">مدير المشروع</dt>
                  <dd className="truncate font-medium">{project?.manager?.name || "غير محدد"}</dd>
                </div>
                <div className="flex min-w-0 flex-col gap-1 border-b pb-3">
                  <dt className="text-xs text-muted-foreground">حالة المشروع</dt>
                  <dd><Badge variant="secondary">{project ? PROJECT_STATUS_AR[project.status] : "—"}</Badge></dd>
                </div>
                <div className="flex min-w-0 flex-col gap-1 border-b pb-3">
                  <dt className="text-xs text-muted-foreground">مدة المشروع</dt>
                  <dd className="font-medium">{formatShortDate(project?.startDate)} - {formatShortDate(project?.endDate)}</dd>
                </div>
              </dl>
              <dl className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
                <div className="flex items-center justify-between gap-2 border-b pb-3"><dt className="text-xs text-muted-foreground">الأهداف المكتملة</dt><dd className="font-semibold tabular-nums">{selectedPeriod.stats.goalsCompleted}/{selectedPeriod.stats.goalsTotal}</dd></div>
                <div className="flex items-center justify-between gap-2 border-b pb-3"><dt className="text-xs text-muted-foreground">الملفات</dt><dd className="font-semibold tabular-nums">{selectedPeriod.stats.filesCount}</dd></div>
                <div className="flex items-center justify-between gap-2 border-b pb-3"><dt className="text-xs text-muted-foreground">التقارير</dt><dd className="font-semibold tabular-nums">{selectedPeriod.stats.reportsCount}</dd></div>
                <div className="flex items-center justify-between gap-2 border-b pb-3"><dt className="text-xs text-muted-foreground">الوقت المتبقي</dt><dd className="font-semibold tabular-nums">{daysUntil(project?.endDate) ?? "—"}</dd></div>
              </dl>
            </div>
          }
        >
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
        </ProjectPeriodWorkspace>
      )}
    </main>
  );
}
