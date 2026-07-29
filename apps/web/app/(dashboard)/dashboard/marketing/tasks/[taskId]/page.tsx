"use client";

import { useState, useMemo, useRef } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

// Design-system components
import { SurfaceCard } from "@/components/design-system/SurfaceCard";
import { MetricCard } from "@/components/design-system/MetricCard";
import { StatusBadge } from "@/components/design-system/StatusBadge";
import { ActionButton } from "@/components/design-system/ActionButton";
import { ProgressBar } from "@/components/design-system/ProgressBar";
import { IconCircle } from "@/components/design-system/IconCircle";
import { InfoPanel } from "@/components/design-system/InfoPanel";
import { FileAttachmentRow } from "@/components/design-system/FileAttachmentRow";
import { EmptyState } from "@/components/common/EmptyState";
import { Skeleton } from "@/components/design-system/Skeleton";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/design-system/Tabs";

// Features / API
import {
  useGetTaskByIdQuery,
  useStartTaskMutation,
  useSubmitTaskMutation,
  useGetTaskFilesQuery,
  useUploadTaskFileMutation,
  useDeleteTaskFileMutation,
  useGetTaskCommentsQuery,
  useAddTaskCommentMutation,
  TaskWithProject,
} from "@/features/tasks/tasksApi";
import {
  useGetCampaignsByTaskQuery,
  useUpdateCampaignStatusMutation,
  useGetTaskStrategyQuery,
} from "@/features/marketing/marketingApi";
import { CampaignFormModal } from "@/components/dashboard/marketing/CampaignFormModal";
import {
  buildDefaultClientStats,
  ClientContextPanel,
} from "@/components/client-detail/ClientDetailPattern";
import { MarketingStrategySection } from "@/components/dashboard/marketing/MarketingStrategySection";
import { downloadTaskFile } from "@/lib/downloadFile";
import { formatFileSize } from "@/lib/format";
import { useGetClientTeamViewQuery } from "@/features/clients/clientsApi";

// Utils / format
import {
  formatCurrency,
  formatDate,
  formatNumber,
  formatRelativeTime,
  daysUntil,
} from "@/lib/format";
import {
  TASK_STATUS_LABELS,
  TASK_PRIORITY_LABELS,
} from "@/lib/utils/task-status";
import {
  TaskStatus,
  TaskPriority,
  CampaignStatus,
  FilePurpose,
} from "@hassad/shared";
import type { TaskFile, TaskComment } from "@hassad/shared";

// Icons
import {
  ArrowRight,
  Megaphone,
  Plus,
  Target,
  BarChart3,
  Info,
  Wallet,
  CheckCircle2,
  Zap,
  AlertTriangle,
  TrendingUp,
  MousePointerClick,
  Eye,
  PauseCircle,
  PlayCircle,
  StopCircle,
  MessageSquare,
  Paperclip,
  Upload,
  Send,
  Clock,
  Trash2,
  Users,
  User,
  Gauge,
  FileText,
} from "lucide-react";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Legend,
} from "recharts";

import {
  CAMPAIGN_STATUS_LABELS,
  CAMPAIGN_STATUS_BADGE,
  PLATFORM_LABELS,
  PLATFORM_ICON_BG,
} from "@/lib/utils/campaign-constants";

const TASK_STATUS_MAP: Record<TaskStatus, string> = {
  [TaskStatus.TODO]: "PENDING",
  [TaskStatus.IN_PROGRESS]: "ACTIVE",
  [TaskStatus.IN_REVIEW]: "WARNING",
  [TaskStatus.REVISION]: "DANGER",
  [TaskStatus.DONE]: "COMPLETED",
};

const FILE_PURPOSE_LABELS: Record<string, string> = {
  DELIVERABLE: "تسليم نهائي",
  REFERENCE: "مرجع",
  INTERNAL_DRAFT: "مسودة داخلية",
};

// ── Component ─────────────────────────────────────────────────────────────────

export default function MarketingTaskDetailPage() {
  const params = useParams();
  const taskId = params.taskId as string;

  const { data: rawTask, isLoading: isTaskLoading } =
    useGetTaskByIdQuery(taskId);
  const task = rawTask as unknown as TaskWithProject;
  const { data: campaigns = [] } = useGetCampaignsByTaskQuery(taskId);
  const { data: strategy } = useGetTaskStrategyQuery(taskId);
  const strategyApproved = strategy?.status === "APPROVED";
   // The marketing task page is only accessible by marketers/PMs

  const clientId = task?.project?.clientId ?? "";
  const { data: teamView } = useGetClientTeamViewQuery(clientId, {
    skip: !clientId,
  });

  const [isModalOpen, setIsModalOpen] = useState(false);

  const [startTask] = useStartTaskMutation();
  const [submitTask] = useSubmitTaskMutation();

  // ── Aggregated metrics (MUST be before any conditional returns) ────────
  const aggregated = useMemo(() => {
    const spend = campaigns.reduce(
      (acc, c: any) => acc + (c.budgetSpent ?? 0),
      0,
    );
    const budgetTotal = campaigns.reduce(
      (acc, c: any) => acc + (c.budgetTotal ?? 0),
      0,
    );
    const conv = campaigns.reduce(
      (acc, c: any) => acc + (c.conversions ?? 0),
      0,
    );
    const rev = campaigns.reduce((acc, c: any) => acc + (c.revenue ?? 0), 0);
    const impressions = campaigns.reduce(
      (acc, c: any) => acc + (c.impressions ?? 0),
      0,
    );
    const clicks = campaigns.reduce((acc, c: any) => acc + (c.clicks ?? 0), 0);
    return { spend, budgetTotal, conv, rev, impressions, clicks };
  }, [campaigns]);

  const chartData = useMemo(() => {
    return campaigns.map((c: any) => ({
      name: c.name.length > 14 ? c.name.slice(0, 14) + "…" : c.name,
      إنفاق: c.budgetSpent || 0,
      عائد: c.revenue || 0,
    }));
  }, [campaigns]);

  if (isTaskLoading) return <DetailSkeleton />;
  if (!task)
    return (
      <div className="py-20 text-center">
        <p className="text-lg text-neutral-300">المهمة غير موجودة</p>
      </div>
    );

  const days = daysUntil(task.dueDate);
  const isOverdue =
    days !== null && days < 0 && task.status !== TaskStatus.DONE;
  const isDueSoon =
    days !== null && days >= 0 && days <= 3 && task.status !== TaskStatus.DONE;

  const totalRoas =
    aggregated.spend > 0 ? aggregated.rev / aggregated.spend : 0;
  const totalCtr =
    aggregated.impressions > 0
      ? (aggregated.clicks / aggregated.impressions) * 100
      : 0;
  const totalCpc =
    aggregated.clicks > 0 ? aggregated.spend / aggregated.clicks : 0;
  const budgetPct =
    aggregated.budgetTotal > 0
      ? Math.round((aggregated.spend / aggregated.budgetTotal) * 100)
      : 0;

  const canStart = task.status === TaskStatus.TODO;
  const canSubmit = task.status === TaskStatus.IN_PROGRESS;

  return (
    <div className="flex flex-col gap-6 pb-10">
      {/* ── Breadcrumb ───────────────────────────────────────────────────── */}
      <Link
        href="/dashboard/marketing/tasks"
        className="inline-flex items-center gap-1.5 text-sm text-portal-note-text hover:text-secondary-500 transition-colors w-fit"
      >
        <ArrowRight className="w-4 h-4" />
        العودة للمهام التسويقية
      </Link>

      {/* ── Page Header (NO SurfaceCard — clean, no double padding) ─────── */}
      <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-2">
            <span className="text-sm text-portal-note-text">
              {task.project?.client?.companyName}
            </span>
            <span className="text-neutral-300">/</span>
            <span className="text-sm font-medium text-natural-100">
              {task.project?.name}
            </span>
          </div>

          <h1 className="text-[28px] font-semibold leading-[1.2] text-natural-100 lg:text-[32px] mb-3">
            {task.title}
          </h1>

          <div className="flex items-center gap-2 flex-wrap">
            <StatusBadge
              status={TASK_STATUS_MAP[task.status as TaskStatus]}
              label={TASK_STATUS_LABELS[task.status as TaskStatus]}
            />
            {task.priority !== TaskPriority.LOW &&
              task.priority !== TaskPriority.NORMAL && (
                <StatusBadge
                  status={
                    task.priority === TaskPriority.URGENT ? "DANGER" : "WARNING"
                  }
                  label={TASK_PRIORITY_LABELS[task.priority as TaskPriority]}
                />
              )}
            {isOverdue && (
              <span className="inline-flex items-center gap-1 text-xs font-medium text-danger-600 bg-danger-50 px-2 py-0.5 rounded-full">
                <AlertTriangle className="w-3 h-3" />
                متأخرة {Math.abs(days || 0)} يوم
              </span>
            )}
            {isDueSoon && (
              <span className="inline-flex items-center gap-1 text-xs font-medium text-alert-600 bg-alert-50 px-2 py-0.5 rounded-full">
                <Clock className="w-3 h-3" />
                متبقي {days} يوم
              </span>
            )}
          </div>
        </div>

        <div className="flex flex-col items-start lg:items-end gap-3 shrink-0">
          <div className="flex items-center gap-5 text-right">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-portal-note-text">
                الموعد
              </p>
              <p
                className={cn(
                  "text-sm font-semibold",
                  isOverdue ? "text-danger-600" : "text-natural-100",
                )}
              >
                {formatDate(task.dueDate)}
              </p>
            </div>
            <div className="h-8 w-px bg-portal-divider" />
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-portal-note-text">
                أسندت بواسطة
              </p>
              <p className="text-sm font-semibold text-natural-100">
                {task.creator?.name}
              </p>
            </div>
            <div className="h-8 w-px bg-portal-divider" />
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-portal-note-text">
                الحملات
              </p>
              <p className="text-sm font-semibold text-natural-100">
                {campaigns.length}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {canStart && (
              <ActionButton
                size="sm"
                onClick={() => startTask(task.id)}
                className="gap-2"
                icon={<PlayCircle className="w-4 h-4" />}
              >
                بدء التنفيذ
              </ActionButton>
            )}
            {canSubmit && (
              <ActionButton
                size="sm"
                onClick={() => submitTask(task.id)}
                className="gap-2"
                icon={<CheckCircle2 className="w-4 h-4" />}
              >
                تسليم المهمة
              </ActionButton>
            )}
          </div>
        </div>
      </div>

      {/* ── Tabs ─────────────────────────────────────────────────────────── */}
      <Tabs defaultValue="strategy" dir="rtl" className="space-y-6">
        <TabsList>
          <TabsTrigger value="strategy" className="gap-1.5">
            <FileText className="w-4 h-4" />
            الدراسة التسويقية
          </TabsTrigger>
          <TabsTrigger value="campaigns" className="gap-1.5">
            <Target className="w-4 h-4" />
            الحملات ({campaigns.length})
          </TabsTrigger>
          <TabsTrigger value="overview" className="gap-1.5">
            <Info className="w-4 h-4" />
            نظرة عامة
          </TabsTrigger>
          <TabsTrigger value="performance" className="gap-1.5">
            <BarChart3 className="w-4 h-4" />
            الأداء
          </TabsTrigger>
          <TabsTrigger value="activity" className="gap-1.5">
            <MessageSquare className="w-4 h-4" />
            النشاط
          </TabsTrigger>
          <TabsTrigger value="client" className="gap-1.5">
            <User className="w-4 h-4" />
            تفاصيل العميل
          </TabsTrigger>
        </TabsList>

        {/* ===== Tab: Strategy ===== */}
        <TabsContent value="strategy" className="space-y-6">
          <MarketingStrategySection
            taskId={taskId}
            isMarketer={!!task?.assignedTo}
            strategyApproved={strategyApproved}
          />
        </TabsContent>

        {/* ===== Tab 1: Campaigns ===== */}
        <TabsContent value="campaigns" className="space-y-6">
          {!strategyApproved && (
            <div className="p-3 border border-amber-200 bg-amber-50 rounded-lg flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0" />
              <p className="text-sm text-amber-800">
                يجب الموافقة على الدراسة التسويقية من العميل قبل إنشاء الحملات.
                انتقل إلى تبويب "الدراسة التسويقية" للبدء.
              </p>
            </div>
          )}
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-natural-100">
                الحملات الإعلانية
              </h3>
              <p className="text-sm text-portal-note-text mt-0.5">
                إدارة الحملات وتحديث مقاييس الأداء
              </p>
            </div>
            <ActionButton
              onClick={() => setIsModalOpen(true)}
              icon={<Plus className="w-4 h-4" />}
              disabled={!strategyApproved}
              title={
                !strategyApproved
                  ? "يجب الموافقة على الدراسة التسويقية أولاً"
                  : undefined
              }
            >
              إضافة حملة
            </ActionButton>
          </div>

          {campaigns.length === 0 ? (
            <EmptyState
              icon={Megaphone}
              title="لا توجد حملات"
              description="لم يتم إنشاء أي حملة مرتبطة بهذه المهمة بعد."
              actionLabel="إنشاء حملة"
              onAction={() => setIsModalOpen(true)}
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {campaigns.map((campaign: any) => (
                <CampaignCard key={campaign.id} campaign={campaign} />
              ))}
            </div>
          )}
        </TabsContent>

        {/* ===== Tab 2: Overview ===== */}
        <TabsContent value="overview">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Task Details */}
            <SurfaceCard
              className="lg:col-span-2"
              title="تفاصيل المهمة"
              icon={Info}
            >
              <div className="space-y-4">
                <p className="text-sm leading-6 text-portal-note-text">
                  {task.description || "لا يوجد وصف لهذه المهمة."}
                </p>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-4 border-t border-portal-divider">
                  <InfoPanel variant="bordered" className="text-center">
                    <p className="text-xs text-portal-note-text mb-1">الموعد</p>
                    <p className="text-sm font-semibold text-natural-100">
                      {formatDate(task.dueDate)}
                    </p>
                  </InfoPanel>
                  <InfoPanel variant="bordered" className="text-center">
                    <p className="text-xs text-portal-note-text mb-1">
                      الأولوية
                    </p>
                    <p className="text-sm font-semibold text-natural-100">
                      {TASK_PRIORITY_LABELS[task.priority as TaskPriority]}
                    </p>
                  </InfoPanel>
                  <InfoPanel variant="bordered" className="text-center">
                    <p className="text-xs text-portal-note-text mb-1">القسم</p>
                    <p className="text-sm font-semibold text-secondary-500">
                      {task.department?.name || "تسويق"}
                    </p>
                  </InfoPanel>
                  <InfoPanel variant="bordered" className="text-center">
                    <p className="text-xs text-portal-note-text mb-1">الحالة</p>
                    <p className="text-sm font-semibold text-natural-100">
                      {TASK_STATUS_LABELS[task.status as TaskStatus]}
                    </p>
                  </InfoPanel>
                </div>
              </div>
            </SurfaceCard>

            {/* Side Column */}
            <div className="space-y-6">
              {/* Client Info */}
              <SurfaceCard title="معلومات العميل" icon={Users}>
                <div className="space-y-4">
                  <div>
                    <p className="text-xs text-portal-note-text mb-1">
                      اسم الشركة
                    </p>
                    <p className="text-sm font-semibold text-natural-100">
                      {task.project?.client?.companyName || "—"}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-portal-note-text mb-1">
                      المشروع
                    </p>
                    <p className="text-sm font-semibold text-natural-100">
                      {task.project?.name || "—"}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-portal-note-text mb-1">
                      المسؤول
                    </p>
                    <p className="text-sm font-semibold text-natural-100">
                      {task.creator?.name || "—"}
                    </p>
                  </div>
                </div>
              </SurfaceCard>

              {/* Task Timeline */}
              <SurfaceCard title="مسار المهمة" icon={Clock}>
                <TaskTimeline task={task} />
              </SurfaceCard>
            </div>
          </div>
        </TabsContent>

        {/* ===== Tab 3: Performance ===== */}
        <TabsContent value="performance">
          <div className="space-y-6">
            {/* Stat cards row */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <MetricCard
                title="إجمالي الميزانية"
                value={formatCurrency(aggregated.budgetTotal)}
                icon={Wallet}
                variant="default"
              />
              <MetricCard
                title="إجمالي الإنفاق"
                value={formatCurrency(aggregated.spend)}
                icon={TrendingUp}
                variant={budgetPct > 90 ? "danger" : "default"}
                trend={budgetPct > 90 ? "down" : "neutral"}
                trendValue={`${budgetPct}% من الميزانية`}
              />
              <MetricCard
                title="إجمالي التحويلات"
                value={formatNumber(aggregated.conv)}
                icon={MousePointerClick}
                variant="default"
              />
              <MetricCard
                title="متوسط ROAS"
                value={totalRoas > 0 ? `${totalRoas.toFixed(2)}x` : "—"}
                icon={Zap}
                variant={
                  totalRoas >= 2
                    ? "success"
                    : totalRoas < 1
                      ? "danger"
                      : "default"
                }
                trend={
                  totalRoas >= 2 ? "up" : totalRoas < 1 ? "down" : "neutral"
                }
                trendValue={
                  totalRoas >= 2 ? "مربح" : totalRoas < 1 ? "خاسر" : "محايد"
                }
              />
            </div>

            {/* Chart */}
            {chartData.length > 0 && (
              <SurfaceCard
                title="مقارنة الحملات"
                description="إنفاق مقابل عائد لكل حملة"
                icon={BarChart3}
              >
                <div className="h-[300px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={chartData}
                      margin={{ top: 10, right: 10, left: 10, bottom: 0 }}
                    >
                      <CartesianGrid
                        strokeDasharray="3 3"
                        vertical={false}
                        stroke="#ECEEF2"
                      />
                      <XAxis
                        dataKey="name"
                        tick={{ fontSize: 11, fill: "#9CA3AF" }}
                        axisLine={false}
                        tickLine={false}
                      />
                      <YAxis
                        tickFormatter={(v) =>
                          v >= 1000 ? `${(v / 1000).toFixed(0)}K` : String(v)
                        }
                        tick={{ fontSize: 11, fill: "#9CA3AF" }}
                        axisLine={false}
                        tickLine={false}
                        orientation="right"
                        width={50}
                      />
                      <Tooltip
                        formatter={(value: number, name: string) => [
                          formatCurrency(value),
                          name,
                        ]}
                        contentStyle={{
                          direction: "rtl",
                          textAlign: "right",
                          fontSize: 12,
                          borderRadius: 8,
                          border: "1px solid #e5e7eb",
                          backgroundColor: "#fff",
                        }}
                      />
                      <Legend
                        wrapperStyle={{ fontSize: 12, paddingTop: 8 }}
                        iconType="circle"
                      />
                      <Bar
                        dataKey="إنفاق"
                        fill="#E7BE52"
                        radius={[4, 4, 0, 0]}
                      />
                      <Bar
                        dataKey="عائد"
                        fill="#121936"
                        radius={[4, 4, 0, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </SurfaceCard>
            )}

            {/* Secondary metrics */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <SurfaceCard title="استهلاك الميزانية" icon={Wallet}>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-portal-note-text">
                        نسبة الاستهلاك
                      </p>
                      <p className="text-2xl font-bold text-natural-100">
                        {budgetPct}%
                      </p>
                    </div>
                    <div className="text-left">
                      <p className="text-sm text-portal-note-text">المتبقي</p>
                      <p className="text-lg font-semibold text-natural-100">
                        {formatCurrency(
                          Math.max(
                            0,
                            aggregated.budgetTotal - aggregated.spend,
                          ),
                        )}
                      </p>
                    </div>
                  </div>
                  <ProgressBar
                    value={budgetPct}
                    max={100}
                    variant={
                      budgetPct > 90
                        ? "danger"
                        : budgetPct > 70
                          ? "warning"
                          : "default"
                    }
                    size="md"
                    showLabel
                  />
                  <p className="text-xs text-portal-note-text">
                    {formatCurrency(aggregated.spend)} من{" "}
                    {formatCurrency(aggregated.budgetTotal)}
                  </p>
                </div>
              </SurfaceCard>

              <SurfaceCard title="مؤشرات التفاعل" icon={Gauge}>
                <div className="grid grid-cols-2 gap-3">
                  <MetricCard
                    title="الظهورات"
                    value={formatNumber(aggregated.impressions)}
                  />
                  <MetricCard
                    title="النقرات"
                    value={formatNumber(aggregated.clicks)}
                  />
                  <MetricCard
                    title="معدل CTR"
                    value={totalCtr > 0 ? `${totalCtr.toFixed(2)}%` : "—"}
                  />
                  <MetricCard
                    title="CPC"
                    value={totalCpc > 0 ? formatCurrency(totalCpc) : "—"}
                  />
                </div>
              </SurfaceCard>
            </div>
          </div>
        </TabsContent>

        {/* ===== Tab 4: Activity ===== */}
        <TabsContent value="activity">
          <TaskActivity taskId={taskId} />
        </TabsContent>

        {/* ===== Tab 5: Client Details ===== */}
        <TabsContent value="client" className="space-y-6">
          {teamView ? (
            <ClientContextPanel
              client={teamView.client}
              profile={teamView.profile}
              mode="internal"
              stats={buildDefaultClientStats(teamView.client, "internal")}
            />
          ) : (
            <Skeleton className="h-96 rounded-xl" />
          )}
        </TabsContent>
      </Tabs>

      <CampaignFormModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        taskId={taskId}
      />
    </div>
  );
}

// ── Campaign Card ───────────────────────────────────────────────────────────

function CampaignCard({ campaign }: { campaign: any }) {
  const [updateStatus] = useUpdateCampaignStatusMutation();

  const roas =
    campaign.budgetSpent > 0
      ? (campaign.revenue || 0) / campaign.budgetSpent
      : 0;
  const ctr =
    campaign.impressions > 0
      ? ((campaign.clicks || 0) / campaign.impressions) * 100
      : 0;
  const budgetPct =
    campaign.budgetTotal > 0
      ? Math.min(100, (campaign.budgetSpent / campaign.budgetTotal) * 100)
      : 0;

  const canStart = campaign.status === CampaignStatus.PLANNING;
  const canPause = campaign.status === CampaignStatus.ACTIVE;
  const canStop =
    campaign.status === CampaignStatus.ACTIVE ||
    campaign.status === CampaignStatus.PAUSED;
  const canComplete =
    campaign.status === CampaignStatus.ACTIVE ||
    campaign.status === CampaignStatus.PAUSED;

  return (
    <SurfaceCard
      className={cn(
        "group border-portal-card-border hover:border-secondary-500/40 transition-all",
        campaign.needsOptimization && "border-danger-200 bg-danger-50/10",
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <IconCircle
            icon={Megaphone}
            size="sm"
            className={cn(
              "border-0",
              PLATFORM_ICON_BG[campaign.platform] ||
                "bg-neutral-100 text-neutral-500",
            )}
          />
          <span className="text-xs font-medium text-portal-note-text">
            {PLATFORM_LABELS[campaign.platform] || campaign.platform}
          </span>
        </div>
        <StatusBadge
          status={CAMPAIGN_STATUS_BADGE[campaign.status] || "PENDING"}
          label={CAMPAIGN_STATUS_LABELS[campaign.status] || campaign.status}
          className="text-[10px]"
        />
      </div>

      {/* Name — clickable link to campaign page */}
      <Link href={`/dashboard/marketing/campaigns/${campaign.id}`}>
        <h4 className="font-semibold text-natural-100 mb-1 group-hover:text-secondary-500 transition-colors truncate">
          {campaign.name}
        </h4>
      </Link>

      {/* Budget */}
      <div className="mb-4">
        <div className="flex items-center justify-between text-[11px] text-portal-note-text mb-1">
          <span>استهلاك الميزانية</span>
          <span>
            {formatCurrency(campaign.budgetSpent)} /{" "}
            {formatCurrency(campaign.budgetTotal)}
          </span>
        </div>
        <ProgressBar
          value={budgetPct}
          max={100}
          variant={
            budgetPct > 90 ? "danger" : budgetPct > 70 ? "warning" : "default"
          }
          size="sm"
        />
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-4 gap-2 mb-4">
        <InfoPanel variant="bordered" className="text-center p-2">
          <p className="text-[10px] text-portal-note-text mb-0.5">العائد</p>
          <p className="text-xs font-semibold text-natural-100">
            {formatCurrency(campaign.revenue)}
          </p>
        </InfoPanel>
        <InfoPanel variant="bordered" className="text-center p-2">
          <p className="text-[10px] text-portal-note-text mb-0.5">ROAS</p>
          <p
            className={cn(
              "text-xs font-semibold",
              roas >= 2
                ? "text-success-600"
                : roas < 1 && roas > 0
                  ? "text-danger-600"
                  : "text-natural-100",
            )}
          >
            {roas > 0 ? `${roas.toFixed(1)}x` : "—"}
          </p>
        </InfoPanel>
        <InfoPanel variant="bordered" className="text-center p-2">
          <p className="text-[10px] text-portal-note-text mb-0.5">التحويلات</p>
          <p className="text-xs font-semibold text-natural-100">
            {formatNumber(campaign.conversions)}
          </p>
        </InfoPanel>
        <InfoPanel variant="bordered" className="text-center p-2">
          <p className="text-[10px] text-portal-note-text mb-0.5">CTR</p>
          <p className="text-xs font-semibold text-natural-100">
            {ctr > 0 ? `${ctr.toFixed(1)}%` : "—"}
          </p>
        </InfoPanel>
      </div>

      {/* Needs optimization flag */}
      {campaign.needsOptimization && (
        <div className="flex items-center gap-1.5 mb-3 text-danger-600 text-xs font-medium">
          <AlertTriangle className="w-3.5 h-3.5" />
          <span>تحتاج تحسين — مراجعة الأداء مطلوبة</span>
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center gap-2">
        <Link
          href={`/dashboard/marketing/campaigns/${campaign.id}`}
          className="flex-1"
        >
          <ActionButton
            variant="outline"
            size="sm"
            className="w-full gap-2 group-hover:bg-secondary-500 group-hover:text-white transition-all"
            icon={<Eye className="w-4 h-4" />}
          >
            إدارة
          </ActionButton>
        </Link>
        {canStart && (
          <ActionButton
            size="sm"
            className="gap-1"
            onClick={() => updateStatus({ id: campaign.id, action: "start" })}
            icon={<PlayCircle className="w-3.5 h-3.5" />}
          >
            تشغيل
          </ActionButton>
        )}
        {canPause && (
          <ActionButton
            size="sm"
            variant="outline"
            className="gap-1"
            onClick={() => updateStatus({ id: campaign.id, action: "pause" })}
            icon={<PauseCircle className="w-3.5 h-3.5" />}
          >
            إيقاف
          </ActionButton>
        )}
        {canStop && (
          <ActionButton
            size="sm"
            variant="outline"
            className="gap-1 border-danger-200 text-danger-600 hover:bg-danger-50"
            onClick={() => updateStatus({ id: campaign.id, action: "stop" })}
            icon={<StopCircle className="w-3.5 h-3.5" />}
          >
            إنهاء
          </ActionButton>
        )}
        {canComplete && (
          <ActionButton
            size="sm"
            className="gap-1"
            onClick={() => updateStatus({ id: campaign.id, action: "end" })}
            icon={<CheckCircle2 className="w-3.5 h-3.5" />}
          >
            إكمال
          </ActionButton>
        )}
      </div>
    </SurfaceCard>
  );
}

// ── Task Activity (Comments + Files) ──────────────────────────────────────

function TaskActivity({ taskId }: { taskId: string }) {
  const { data: comments = [], isLoading: commentsLoading } =
    useGetTaskCommentsQuery(taskId);
  const { data: files = [], isLoading: filesLoading } =
    useGetTaskFilesQuery(taskId);
  const [addComment] = useAddTaskCommentMutation();
  const [uploadFile] = useUploadTaskFileMutation();
  const [deleteFile] = useDeleteTaskFileMutation();

  const [commentText, setCommentText] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim()) return;
    try {
      await addComment({ taskId, content: commentText.trim() }).unwrap();
      setCommentText("");
      toast.success("تم إضافة التعليق");
    } catch {
      toast.error("فشل إضافة التعليق");
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      await uploadFile({
        taskId,
        file,
        purpose: "REFERENCE" as FilePurpose,
      }).unwrap();
      toast.success("تم رفع الملف");
      if (fileInputRef.current) fileInputRef.current.value = "";
    } catch {
      toast.error("فشل رفع الملف");
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Comments */}
      <SurfaceCard
        className="lg:col-span-2"
        title="التعليقات"
        icon={MessageSquare}
        action={
          <span className="text-xs text-portal-note-text">
            {comments.length} تعليق
          </span>
        }
      >
        <div className="space-y-4">
          <form onSubmit={handleAddComment} className="flex gap-2">
            <input
              type="text"
              placeholder="اكتب تعليقاً..."
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              className="flex-1 h-10 rounded-xl border border-portal-card-border bg-natural-0 px-3 text-sm text-right placeholder:text-neutral-200 focus:outline-none focus:border-secondary-500 focus:ring-1 focus:ring-secondary-500/20 transition-colors"
            />
            <ActionButton
              type="submit"
              size="sm"
              disabled={!commentText.trim()}
              icon={<Send className="w-4 h-4" />}
            >
              إرسال
            </ActionButton>
          </form>

          {commentsLoading ? (
            <div className="space-y-3">
              {[1, 2].map((i) => (
                <Skeleton key={i} className="h-16 rounded-xl" />
              ))}
            </div>
          ) : comments.length === 0 ? (
            <div className="py-8 text-center">
              <MessageSquare className="w-8 h-8 text-neutral-300 mx-auto mb-2" />
              <p className="text-sm text-portal-note-text">لا توجد تعليقات</p>
            </div>
          ) : (
            <div className="space-y-3">
              {comments.map((comment: TaskComment) => (
                <CommentCard key={comment.id} comment={comment} />
              ))}
            </div>
          )}
        </div>
      </SurfaceCard>

      {/* Files */}
      <SurfaceCard
        title="الملفات"
        icon={Paperclip}
        action={
          <button
            onClick={() => fileInputRef.current?.click()}
            className="text-xs text-secondary-500 hover:text-secondary-600 font-medium flex items-center gap-1 cursor-pointer"
          >
            <Upload className="w-3.5 h-3.5" />
            رفع
          </button>
        }
      >
        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          onChange={handleFileUpload}
        />
        <div className="space-y-3">
          {filesLoading ? (
            <div className="space-y-3">
              {[1, 2].map((i) => (
                <Skeleton key={i} className="h-14 rounded-xl" />
              ))}
            </div>
          ) : files.length === 0 ? (
            <div className="py-8 text-center">
              <Paperclip className="w-8 h-8 text-neutral-300 mx-auto mb-2" />
              <p className="text-sm text-portal-note-text">لا توجد ملفات</p>
            </div>
          ) : (
            <div className="space-y-2">
              {files.map((file: TaskFile) => (
                <FileAttachmentRow
                  key={file.id}
                  filename={file.fileName}
                  size={formatFileSize(file.fileSize)}
                  type={
                    FILE_PURPOSE_LABELS[file.purpose as string] || file.purpose
                  }
                  onDownload={() =>
                    downloadTaskFile(taskId, file.id, file.fileName)
                  }
                  action={
                    <button
                      onClick={() =>
                        deleteFile({ taskId, fileId: file.id })
                          .unwrap()
                          .then(() => toast.success("تم حذف الملف"))
                          .catch(() => toast.error("فشل حذف الملف"))
                      }
                      className="text-neutral-300 hover:text-danger-600 transition-colors cursor-pointer"
                      title="حذف"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  }
                />
              ))}
            </div>
          )}
        </div>
      </SurfaceCard>
    </div>
  );
}

function CommentCard({ comment }: { comment: TaskComment }) {
  const authorName = comment.user?.name ?? "مستخدم";
  const initials = authorName.charAt(0);

  return (
    <div className="flex gap-3 p-3 rounded-xl bg-natural-0 border border-portal-card-border">
      <div className="w-9 h-9 rounded-full bg-secondary-100 text-secondary-600 flex items-center justify-center font-semibold text-sm shrink-0">
        {initials}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-natural-100">
            {authorName}
          </span>
          <span className="text-[11px] text-neutral-400">
            {formatRelativeTime(comment.createdAt as string)}
          </span>
        </div>
        <p className="text-sm text-portal-note-text mt-1 whitespace-pre-wrap">
          {comment.content}
        </p>
      </div>
    </div>
  );
}

// ── Task Timeline ───────────────────────────────────────────────────────────

function TaskTimeline({ task }: { task: TaskWithProject }) {
  const steps = [
    {
      label: "تم إنشاء المهمة",
      date: task.createdAt,
      done: true,
      variant: "success" as const,
    },
    {
      label: "بدء التنفيذ",
      date: (task as any).startedAt,
      done: !!(task as any).startedAt,
      variant: "success" as const,
    },
    {
      label: "التسليم للمراجعة",
      date: (task as any).submittedAt,
      done: !!(task as any).submittedAt,
      variant: "warning" as const,
    },
    {
      label: "الاعتماد النهائي",
      date: (task as any).approvedAt,
      done: !!(task as any).approvedAt,
      variant: "success" as const,
    },
  ];

  return (
    <div className="space-y-0">
      {steps.map((step, i) => (
        <div key={step.label} className="flex gap-3 relative">
          {i < steps.length - 1 && (
            <div
              className={cn(
                "absolute right-[15px] top-8 bottom-0 w-0.5",
                step.done ? "bg-secondary-500" : "bg-neutral-100",
              )}
            />
          )}
          <div
            className={cn(
              "w-8 h-8 rounded-full flex items-center justify-center shrink-0 z-10",
              step.done
                ? "bg-secondary-500 text-white"
                : "bg-neutral-100 text-neutral-300 border border-neutral-200",
            )}
          >
            {step.done ? (
              <CheckCircle2 className="w-4 h-4" />
            ) : (
              <span className="w-2 h-2 rounded-full bg-neutral-300" />
            )}
          </div>
          <div className="pb-5">
            <p
              className={cn(
                "text-sm font-medium",
                step.done ? "text-natural-100" : "text-neutral-300",
              )}
            >
              {step.label}
            </p>
            {step.date && (
              <p className="text-xs text-portal-note-text">
                {formatDate(step.date)}
              </p>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Skeleton ────────────────────────────────────────────────────────────────

function DetailSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-6 w-48" />
      <div className="space-y-2">
        <Skeleton className="h-8 w-3/4" />
        <Skeleton className="h-5 w-40" />
      </div>
      <Skeleton className="h-12 w-96 rounded-2xl" />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Skeleton className="h-72 rounded-[30px]" />
        <Skeleton className="h-72 rounded-[30px]" />
      </div>
    </div>
  );
}
