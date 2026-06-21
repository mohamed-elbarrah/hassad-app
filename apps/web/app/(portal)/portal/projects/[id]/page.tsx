"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import {
  Calendar,
  DollarSign,
  FileText,
  Megaphone,
  Paperclip,
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
  PeriodTimeline,
  StatCards,
  GoalsTab,
  FilesTab,
  ReportsTab,
  CampaignsTab,
  MeetingsTab,
  InvoiceTab,
} from "@/components/portal/project-detail";

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
  const active = periods.find((p) => p.status === "ACTIVE");
  return (active ?? periods[0]).id;
}

export default function PortalProjectPeriodsPage() {
  const params = useParams();
  const projectId = params.id as string;

  const { data: project, isLoading: projectLoading } =
    useGetPortalProjectDetailQuery(projectId);
  const { data: periods, isLoading: periodsLoading } =
    useGetPortalProjectPeriodsQuery(projectId);

  const [triggerReportDownload] = useLazyDownloadPeriodReportQuery();
  const [triggerFileDownload] = useLazyDownloadPeriodFileQuery();

  const [selectedPeriodId, setSelectedPeriodId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<string>("goals");

  // Auto-select the active (or first) period once periods load.
  useEffect(() => {
    if (periods && periods.length > 0 && !selectedPeriodId) {
      setSelectedPeriodId(pickInitialPeriod(periods));
    }
  }, [periods, selectedPeriodId]);

  const selectedPeriod = periods?.find((p) => p.id === selectedPeriodId) ?? null;

  // ── Download handlers ────────────────────────────────────────────────────

  const downloadPeriodReport = async () => {
    if (!selectedPeriod) return;
    const res = await triggerReportDownload(selectedPeriod.id);
    if (res.data?.url) window.open(res.data.url, "_blank");
  };

  const downloadPeriodFile = async (file: PortalPeriodFile) => {
    if (!selectedPeriod) return;
    const res = await triggerFileDownload({
      periodId: selectedPeriod.id,
      fileId: file.id,
    });
    if (res.data?.url) window.open(res.data.url, "_blank");
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
        <HeroCard
          period={selectedPeriod}
          totalPeriods={periods.length}
          onDownloadReport={downloadPeriodReport}
          onViewInvoice={() => setActiveTab("invoices")}
        />
      )}

      {selectedPeriod && (
        <PeriodTimeline
          periods={periods}
          selectedId={selectedPeriod.id}
          onSelect={(period) => setSelectedPeriodId(period.id)}
        />
      )}

      {selectedPeriod && <StatCards stats={selectedPeriod.stats} />}

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
                <TabsTrigger key={tab.id} value={tab.id} className="gap-2 py-2.5">
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
            <CampaignsTab />
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