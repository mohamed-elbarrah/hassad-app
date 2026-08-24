"use client";

import { use, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Eye,
  AlertTriangle,
  Upload,
  FolderKanban,
} from "lucide-react";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ProjectForm } from "@/components/dashboard/pm/ProjectForm";
import { PageHeader } from "@/components/common/PageHeader";
import { PmPeriodTabs } from "@/components/dashboard/pm/PmPeriodTabs";
import { ProjectPeriodWorkspace } from "@/components/project-detail/ProjectPeriodWorkspace";
import { PmDetailBreadcrumb } from "@/components/dashboard/pm/shared/PmDetailBreadcrumb";
import { PmDetailError } from "@/components/dashboard/pm/shared/PmDetailError";
import { PmDetailSkeleton } from "@/components/dashboard/pm/shared/PmDetailSkeleton";
import { PmStatusBadge } from "@/components/dashboard/pm/shared/PmStatusBadge";
import {
  useGetPmProjectByIdQuery,
  useGetPmProjectPeriodsQuery,
  useGetPmProjectPeriodQuery,
  useGetPmProjectFilesQuery,
  useUploadPmProjectFileMutation,
} from "@/features/projects/projectsApi";
import { useLazyGetProjectGroupChatQuery } from "@/features/chat/chatApi";
import { useAppSelector } from "@/lib/hooks";

import { type ProjectWithMeta } from "@/lib/utils/project-status";
import { cn } from "@/lib/utils";
import { ProjectStatus } from "@hassad/shared";
import { daysUntil, formatShortDate } from "@/lib/format";

// ── Types ─────────────────────────────────────────────────────────────────────

interface ProjectDetailPageProps {
  params: Promise<{ id: string }>;
}

// ── Main Page Component ──────────────────────────────────────────────────────

export default function ProjectDetailPage({ params }: ProjectDetailPageProps) {
  const { id } = use(params);
  const router = useRouter();
  const { user } = useAppSelector((state) => state.auth);
  const [selectedPeriodId, setSelectedPeriodId] = useState<string | null>(null);

  const {
    data: project,
    isLoading,
    isError,
    refetch,
  } = useGetPmProjectByIdQuery(id);
  const { data: periods = [], isLoading: periodsLoading } =
    useGetPmProjectPeriodsQuery(id);
  const selectedPeriod =
    periods.find((period) => period.id === selectedPeriodId) ??
    periods.find((period) => period.status === "ACTIVE") ??
    periods[0];
  const { data: selectedPeriodDetail, isLoading: periodDetailLoading, refetch: refetchPeriod } =
    useGetPmProjectPeriodQuery(
      { projectId: id, periodId: selectedPeriod?.id ?? "" },
      { skip: !selectedPeriod?.id },
    );
  const { data: files, isLoading: filesLoading } =
    useGetPmProjectFilesQuery(id);
  const [getGroupChat, { isFetching: isLoadingGroupChat }] =
    useLazyGetProjectGroupChatQuery();

  const [uploadFile, { isLoading: isUploading }] =
    useUploadPmProjectFileMutation();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const openGroupChat = async () => {
    try {
      const conversation = await getGroupChat(id).unwrap();
      if (conversation?.id) {
        router.push(`/dashboard/messages?conversationId=${conversation.id}`);
      }
    } catch {
      // Group chat may not exist yet; ignore silently
    }
  };

  if (!user) return null;

  // Loading state
  if (isLoading) {
    return <PmDetailSkeleton variant="project" />;
  }

  // Error state
  if (isError || !project) {
    return (
      <PmDetailError
        title="المشروع غير موجود"
        onRetry={refetch}
        backHref="/dashboard/pm"
        backLabel="المشاريع"
      />
    );
  }

  const p = project as ProjectWithMeta;
  const totalTasks = p.taskStats?.total ?? 0;
  const completedTasks = p.taskStats?.completed ?? 0;
  const overdueTasks = p.taskStats?.overdue ?? 0;

  return (
    <div className="page-shell" dir="rtl">
      {/* ── Breadcrumb ─────────────────────────────────────────────────────── */}
      <PmDetailBreadcrumb
        backHref="/dashboard/pm"
        backLabel="المشاريع"
        title={project.name}
      />

      <PageHeader
        title={project.name}
        description={project.description || "ملخص واضح للتنفيذ التجاري والتشغيلي لهذا المشروع."}
        icon={FolderKanban}
        actions={<ProjectForm project={project} currentUserId={user.id} />}
      />
      <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-muted-foreground">
        <PmStatusBadge domain="project" status={project.status} />
        <span>العميل: {p.client?.companyName || "غير محدد"}</span>
        <span>مدير المشروع: {p.manager?.name || "غير محدد"}</span>
      </div>

      {/* Status Banners */}
      {project.status === ProjectStatus.AWAITING_REVIEW && (
        <Card className="border-primary/30 bg-primary/5">
          <CardContent className="flex items-center gap-3 p-4">
            <Eye className="size-5 shrink-0 text-primary" />
            <div className="flex flex-col gap-1">
              <p className="text-sm font-medium">بانتظار المراجعة</p>
              <p className="text-sm text-muted-foreground">
                هذا المشروع بانتظار مراجعة العميل والموافقة.
              </p>
            </div>
          </CardContent>
        </Card>
      )}
      {project.status === ProjectStatus.NEEDS_REVISION && (
        <Card className="border-destructive/30 bg-destructive/5">
          <CardContent className="flex items-center gap-3 p-4">
            <AlertTriangle className="size-5 shrink-0 text-destructive" />
            <div className="flex flex-col gap-1">
              <p className="text-sm font-medium">تعديلات مطلوبة</p>
              <p className="text-sm text-muted-foreground">
                طلب العميل تعديلات على هذا المشروع.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Quick Actions Bar */}
      <div className="flex flex-wrap items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploading}
          aria-controls="pm-project-file-upload"
        >
          <Upload data-icon="inline-start" />
          {isUploading ? "جارٍ الرفع..." : "رفع ملف"}
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={openGroupChat}
          disabled={isLoadingGroupChat}
        >
          محادثة الفريق
        </Button>
        <input
          ref={fileInputRef}
          id="pm-project-file-upload"
          type="file"
          aria-label="رفع ملف للمشروع"
          className="hidden"
          onChange={async (e) => {
            const file = e.target.files?.[0];
            if (!file) return;
            try {
              await uploadFile({
                projectId: id,
                file,
                periodId: selectedPeriod?.id,
              }).unwrap();
            } catch {
              /* best-effort operation; the UI remains usable without this refresh */
            }
            if (fileInputRef.current) fileInputRef.current.value = "";
          }}
        />
      </div>

      {(() => {
        const period = selectedPeriodDetail ?? selectedPeriod;
        const overviewItems = [
          { label: "المهام المنجزة", value: `${completedTasks}/${totalTasks}` },
          { label: "المهام المتأخرة", value: String(overdueTasks) },
          { label: "الوقت المتبقي", value: String(daysUntil(project.endDate) ?? "—") },
          { label: "الملفات", value: filesLoading ? "…" : String(files?.length ?? 0) },
        ];

        return (
          <ProjectPeriodWorkspace
            role="pm"
            periods={periods}
            selectedPeriodId={selectedPeriod?.id ?? ""}
            onSelectPeriod={setSelectedPeriodId}
            overview={
              <div className="flex flex-col gap-5">
                <dl className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
                  <div className="flex min-w-0 flex-col gap-1 border-b pb-3">
                    <dt className="text-xs text-muted-foreground">العميل</dt>
                    <dd className="truncate font-medium">{p.client?.companyName || "غير محدد"}</dd>
                  </div>
                  <div className="flex min-w-0 flex-col gap-1 border-b pb-3">
                    <dt className="text-xs text-muted-foreground">مدير المشروع</dt>
                    <dd className="truncate font-medium">{p.manager?.name || "غير محدد"}</dd>
                  </div>
                  <div className="flex min-w-0 flex-col gap-1 border-b pb-3">
                    <dt className="text-xs text-muted-foreground">حالة المشروع</dt>
                    <dd><PmStatusBadge domain="project" status={project.status} /></dd>
                  </div>
                  <div className="flex min-w-0 flex-col gap-1 border-b pb-3">
                    <dt className="text-xs text-muted-foreground">مدة المشروع</dt>
                    <dd className="font-medium">
                      {formatShortDate(project.startDate)} - {formatShortDate(project.endDate)}
                    </dd>
                  </div>
                </dl>

                <dl className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
                  {overviewItems.map((item) => (
                    <div key={item.label} className="flex min-w-0 items-center justify-between gap-2 border-b pb-3">
                      <dt className="text-xs text-muted-foreground">{item.label}</dt>
                      <dd className={cn("font-semibold tabular-nums", item.label === "المهام المتأخرة" && overdueTasks > 0 && "text-destructive")}>
                        {item.value}
                      </dd>
                    </div>
                  ))}
                </dl>
              </div>
            }
          >
            {periodsLoading || periodDetailLoading ? (
              <Skeleton className="h-64 w-full" />
            ) : period ? (
              <PmPeriodTabs key={period.id} projectId={id} period={period} onChanged={() => void refetchPeriod()} />
            ) : (
              <div className="border-t pt-5 text-sm text-muted-foreground">
                لا توجد فترات مرتبطة بهذا المشروع بعد.
              </div>
            )}
          </ProjectPeriodWorkspace>
        );
      })()}
    </div>
  );
}
