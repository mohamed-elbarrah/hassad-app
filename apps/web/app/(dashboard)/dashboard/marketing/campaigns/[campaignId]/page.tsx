"use client";

import { useState, useCallback, useEffect } from "react";
import { Input } from "@/components/ui/input";
import Link from "next/link";
import { useParams } from "next/navigation";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

// Design-system
import { Card } from "@/components/ui/card";
import { MetricCard } from "@/components/design-system/MetricCard";
import { StatusBadge } from "@/components/design-system/StatusBadge";
import { ActionButton } from "@/components/design-system/ActionButton";
import { ProgressBar } from "@/components/design-system/ProgressBar";

import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/common/EmptyState";

// API
import {
  useGetCampaignQuery,
  useUpdateCampaignMetricsMutation,
  useUpdateCampaignStatusMutation,
  useFlagOptimizationMutation,
  useDuplicateCampaignMutation,
  useArchiveCampaignMutation,
  useUnarchiveCampaignMutation,
} from "@/features/marketing/marketingApi";

// Format
import { formatCurrency, formatNumber, formatDate } from "@/lib/format";

// Icons
import {
  ArrowRight,
  TrendingUp,
  TrendingDown,
  Minus,
  Target,
  MousePointerClick,
  Zap,
  AlertTriangle,
  Pause,
  Play,
  Square,
  Copy,
  BarChart3,
  DollarSign,
  Activity,
  Wallet,
  CheckCircle2,
  Save,
  RotateCcw,
  Megaphone,
  Gauge,
  Calendar,
  Archive,
  ArchiveRestore,
} from "lucide-react";

import {
  CAMPAIGN_STATUS_LABELS,
  CAMPAIGN_STATUS_BADGE,
  PLATFORM_LABELS,
  computeCampaignMetrics,
} from "@/lib/utils/campaign-constants";

// ── Component ─────────────────────────────────────────────────────────────────

export default function CampaignDetailPage() {
  const params = useParams();
  const campaignId = params.campaignId as string;

  const { data: campaign, isLoading } = useGetCampaignQuery(campaignId);

  const [updateMetrics, { isLoading: isSaving }] =
    useUpdateCampaignMetricsMutation();
  const [updateStatus, { isLoading: isUpdatingStatus }] =
    useUpdateCampaignStatusMutation();
  const [flagOptimization, { isLoading: isFlagging }] =
    useFlagOptimizationMutation();
  const [duplicate, { isLoading: isDuplicating }] =
    useDuplicateCampaignMutation();
  const [archiveCampaign, { isLoading: isArchiving }] =
    useArchiveCampaignMutation();
  const [unarchiveCampaign, { isLoading: isUnarchiving }] =
    useUnarchiveCampaignMutation();

  // Form state (controlled — batch save)
  const [form, setForm] = useState<Record<string, number>>({});
  const [hasChanges, setHasChanges] = useState(false);

  const resetForm = useCallback(() => {
    if (!campaign) return;
    const analytics = campaign.analytics ?? {};
    setForm({
      budgetSpent: Number(campaign.budgetSpent ?? 0),
      revenue: Number(analytics.revenue ?? 0),
      impressions: Number(analytics.impressions ?? 0),
      clicks: Number(analytics.clicks ?? 0),
      conversions: Number(analytics.conversions ?? 0),
    });
    setHasChanges(false);
  }, [campaign]);

  // Sync form when campaign data loads
  useEffect(() => {
    if (campaign) resetForm();
  }, [campaign?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  if (isLoading) return <PageSkeleton />;
  if (!campaign)
    return (
      <div className="py-20 text-center" dir="rtl">
        <EmptyState
          icon={Megaphone}
          title="الحملة غير موجودة"
          description="تعذر العثور على الحملة المطلوبة."
          actionLabel="العودة للمهام"
          actionHref="/dashboard/marketing/tasks"
        />
      </div>
    );

  const m = computeCampaignMetrics({
    ...campaign,
    analytics: {
      ...(campaign.analytics ?? {}),
      impressions: form.impressions ?? campaign.analytics?.impressions ?? 0,
      clicks: form.clicks ?? campaign.analytics?.clicks ?? 0,
      conversions: form.conversions ?? campaign.analytics?.conversions ?? 0,
      revenue: form.revenue ?? campaign.analytics?.revenue ?? 0,
    },
  });
  const budgetPct =
    campaign.budgetTotal > 0
      ? Math.min(100, (m.budgetSpent / campaign.budgetTotal) * 100)
      : 0;

  const isProfitable = m.profit > 0;
  const isRoasGood = m.roas >= 2;
  const isRoasBad = m.roas > 0 && m.roas < 1;

  const canStart = campaign.status === "PLANNING";
  const canPause = campaign.status === "ACTIVE";
  const canStop = campaign.status === "ACTIVE" || campaign.status === "PAUSED";
  const canComplete =
    campaign.status === "ACTIVE" || campaign.status === "PAUSED";

  const backHref = campaign.taskId
    ? `/dashboard/marketing/tasks/${campaign.taskId}`
    : "/dashboard/marketing/tasks";

  // ── Actions ────────────────────────────────────────────────────────────────

  const handleStatusAction = async (
    action: "start" | "pause" | "stop" | "end",
  ) => {
    try {
      await updateStatus({ id: campaign.id, action }).unwrap();
      toast.success("تم تحديث حالة الحملة");
    } catch {
      toast.error("فشل تحديث الحالة");
    }
  };

  const handleFlagOptimization = async () => {
    try {
      await flagOptimization({
        id: campaign.id,
        needsOptimization: !campaign.needsOptimization,
      }).unwrap();
      toast.success("تم تحديث حالة التحسين");
    } catch {
      toast.error("فشل التحديث");
    }
  };

  const handleDuplicate = async () => {
    try {
      await duplicate(campaign.id).unwrap();
      toast.success("تم تكرار الحملة بنجاح");
    } catch {
      toast.error("فشل تكرار الحملة");
    }
  };

  const handleArchive = async () => {
    try {
      await archiveCampaign(campaign.id).unwrap();
      toast.success("تم أرشفة الحملة");
    } catch {
      toast.error("فشل أرشفة الحملة");
    }
  };

  const handleUnarchive = async () => {
    try {
      await unarchiveCampaign(campaign.id).unwrap();
      toast.success("تم استعادة الحملة من الأرشيف");
    } catch {
      toast.error("فشل استعادة الحملة");
    }
  };

  const handleSaveMetrics = async () => {
    try {
      await updateMetrics({
        id: campaign.id,
        body: {
          budgetSpent: form.budgetSpent,
          revenue: form.revenue,
          impressions: form.impressions,
          clicks: form.clicks,
          conversions: form.conversions,
        },
      }).unwrap();
      toast.success("تم حفظ المقاييس بنجاح");
      setHasChanges(false);
    } catch {
      toast.error("فشل حفظ المقاييس");
    }
  };

  const updateField = (field: string, value: number) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setHasChanges(true);
  };

  // ── Metric sections ──────────────────────────────────────────────────────

  const metricSections = [
    {
      title: "الأداء المالي والربحية",
      icon: <DollarSign className="w-4 h-4" />,
      metrics: [
        {
          label: "الربح الصافي",
          value: formatCurrency(m.profit),
          tone: isProfitable ? "success" : m.profit < 0 ? "danger" : "neutral",
        },
        {
          label: "الـ ROAS",
          value: m.roas > 0 ? `${m.roas.toFixed(2)}x` : "—",
          tone: isRoasGood ? "success" : isRoasBad ? "danger" : "neutral",
        },
        { label: "الإنفاق الكلي", value: formatCurrency(m.budgetSpent) },
        { label: "إجمالي العائد", value: formatCurrency(m.revenue) },
      ],
    },
    {
      title: "التحويلات والاستحواذ",
      icon: <Target className="w-4 h-4" />,
      metrics: [
        { label: "التحويلات", value: formatNumber(m.conversions) },
        {
          label: "الـ CPA",
          value: m.cpa > 0 ? formatCurrency(m.cpa) : "—",
          tone: m.cpa > 0 && m.cpa < 50 ? "success" : "neutral",
        },
        {
          label: "معدل التحويل",
          value: m.convRate > 0 ? `${m.convRate.toFixed(2)}%` : "—",
          tone:
            m.convRate > 1 ? "success" : m.convRate > 0 ? "danger" : "neutral",
        },
        {
          label: "تكلفة العميل",
          value: m.cpa > 0 ? formatCurrency(m.cpa) : "—",
        },
      ],
    },
    {
      title: "التفاعل والوصول",
      icon: <Activity className="w-4 h-4" />,
      metrics: [
        { label: "الظهور", value: formatNumber(m.impressions) },
        { label: "النقرات", value: formatNumber(m.clicks) },
        {
          label: "الـ CTR",
          value: m.ctr > 0 ? `${m.ctr.toFixed(2)}%` : "—",
          tone: m.ctr > 0.8 ? "success" : m.ctr > 0 ? "danger" : "neutral",
        },
        { label: "الـ CPM", value: m.cpm > 0 ? formatCurrency(m.cpm) : "—" },
      ],
    },
  ];

  return (
    <div className="page-shell" dir="rtl">
      {/* ── Breadcrumb ───────────────────────────────────────────────────── */}
      <Link
        href={backHref}
        className="inline-flex items-center gap-1.5 text-sm text-portal-note-text hover:text-secondary-500 transition-colors w-fit"
      >
        <ArrowRight className="w-4 h-4" />
        العودة للمهمة
      </Link>

      {/* ── Page Header ──────────────────────────────────────────────────── */}
      <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-2">
            <StatusBadge
              status={CAMPAIGN_STATUS_BADGE[campaign.status] || "PENDING"}
              label={CAMPAIGN_STATUS_LABELS[campaign.status] || campaign.status}
            />
            <span className="text-xs text-portal-note-text">
              {PLATFORM_LABELS[campaign.platform] || campaign.platform}
            </span>
            <span className="text-xs text-portal-note-text">·</span>
            <span className="text-xs text-portal-note-text flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              {formatDate(campaign.startDate)}
            </span>
          </div>

          <h1 className="text-[28px] font-semibold leading-[1.2] text-natural-100 lg:text-[32px] mb-3">
            {campaign.name}
          </h1>

          <ProfitabilityBadge profit={m.profit} roas={m.roas} />
        </div>

        <div className="flex flex-col items-start lg:items-end gap-3 shrink-0">
          <div className="flex items-center gap-5 text-right">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-portal-note-text">
                الميزانية
              </p>
              <p className="text-sm font-semibold text-natural-100">
                {formatCurrency(campaign.budgetTotal)}
              </p>
            </div>
            <div className="h-8 w-px bg-portal-divider" />
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-portal-note-text">
                الإنفاق
              </p>
              <p className="text-sm font-semibold text-natural-100">
                {formatCurrency(m.budgetSpent)}
              </p>
            </div>
            <div className="h-8 w-px bg-portal-divider" />
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-portal-note-text">
                المتبقي
              </p>
              <p className="text-sm font-semibold text-natural-100">
                {formatCurrency(
                  Math.max(0, campaign.budgetTotal - m.budgetSpent),
                )}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ── Budget Utilization ─────────────────────────────────────────── */}
      <Card title="استهلاك الميزانية" icon={Wallet}>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-portal-note-text">نسبة الاستهلاك</p>
              <p className="text-3xl font-bold text-natural-100">
                {budgetPct.toFixed(1)}%
              </p>
            </div>
            <div className="text-left">
              <p className="text-sm text-portal-note-text">المتبقي</p>
              <p className="text-xl font-semibold text-natural-100">
                {formatCurrency(
                  Math.max(0, campaign.budgetTotal - m.budgetSpent),
                )}
              </p>
            </div>
          </div>
          <ProgressBar
            value={budgetPct}
            max={100}
            variant={
              budgetPct > 90 ? "danger" : budgetPct > 70 ? "warning" : "default"
            }
            size="md"
            showLabel
          />
          <p className="text-xs text-portal-note-text">
            {formatCurrency(m.budgetSpent)} من{" "}
            {formatCurrency(campaign.budgetTotal)}
          </p>
        </div>
      </Card>

      {/* ── Quick Actions ────────────────────────────────────────────────── */}
      <Card title="الإجراءات السريعة" icon={Zap}>
        <div className="flex flex-wrap gap-2">
          {canStart && (
            <ActionButton
              size="sm"
              className="gap-2"
              onClick={() => handleStatusAction("start")}
              disabled={isUpdatingStatus}
              icon={<Play className="w-4 h-4" />}
            >
              تفعيل
            </ActionButton>
          )}
          {canPause && (
            <ActionButton
              size="sm"
              variant="outline"
              className="gap-2"
              onClick={() => handleStatusAction("pause")}
              disabled={isUpdatingStatus}
              icon={<Pause className="w-4 h-4" />}
            >
              إيقاف مؤقت
            </ActionButton>
          )}
          {canStop && (
            <ActionButton
              size="sm"
              variant="outline"
              className="gap-2 border-danger-200 text-danger-600 hover:bg-danger-50"
              onClick={() => handleStatusAction("stop")}
              disabled={isUpdatingStatus}
              icon={<Square className="w-4 h-4" />}
            >
              إنهاء نهائي
            </ActionButton>
          )}
          {canComplete && (
            <ActionButton
              size="sm"
              className="gap-2"
              onClick={() => handleStatusAction("end")}
              disabled={isUpdatingStatus}
              icon={<CheckCircle2 className="w-4 h-4" />}
            >
              إكمال
            </ActionButton>
          )}
          <ActionButton
            size="sm"
            variant="outline"
            className="gap-2"
            onClick={handleDuplicate}
            disabled={isDuplicating}
            icon={<Copy className="w-4 h-4" />}
          >
            تكرار
          </ActionButton>
          <ActionButton
            size="sm"
            variant={campaign.needsOptimization ? "primary" : "outline"}
            className="gap-2"
            onClick={handleFlagOptimization}
            disabled={isFlagging}
            icon={<AlertTriangle className="w-4 h-4" />}
          >
            {campaign.needsOptimization ? "إلغاء علامة التحسين" : "يحتاج تحسين"}
          </ActionButton>
          {campaign.isArchived ? (
            <ActionButton
              size="sm"
              variant="outline"
              className="gap-2"
              onClick={handleUnarchive}
              disabled={isUnarchiving}
              icon={<ArchiveRestore className="w-4 h-4" />}
            >
              استعادة من الأرشيف
            </ActionButton>
          ) : (
            <ActionButton
              size="sm"
              variant="outline"
              className="gap-2"
              onClick={handleArchive}
              disabled={isArchiving}
              icon={<Archive className="w-4 h-4" />}
            >
              أرشفة
            </ActionButton>
          )}
        </div>
      </Card>

      {/* ── Needs Optimization Warning ─────────────────────────────────── */}
      {campaign.needsOptimization && (
        <div className="flex items-center gap-3 p-4 rounded-xl bg-danger-50 border border-danger-200 text-danger-700">
          <AlertTriangle className="w-5 h-5 shrink-0" />
          <div>
            <p className="font-semibold">
              تم وضع علامة "تحتاج تحسين" على هذه الحملة.
            </p>
            <p className="text-sm mt-0.5">
              مراجعة الأداء مطلوبة. تحقق من المقاييس وقم بتحديث البيانات.
            </p>
          </div>
        </div>
      )}

      {/* ── Stats Row ────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <MetricCard
          title="الربح الصافي"
          value={formatCurrency(m.profit)}
          icon={DollarSign}
          variant={
            m.profit > 0 ? "success" : m.profit < 0 ? "danger" : "default"
          }
        />
        <MetricCard
          title="الـ ROAS"
          value={m.roas > 0 ? `${m.roas.toFixed(2)}x` : "—"}
          icon={TrendingUp}
          variant={isRoasGood ? "success" : isRoasBad ? "danger" : "default"}
        />
        <MetricCard
          title="التحويلات"
          value={formatNumber(m.conversions)}
          icon={Target}
          variant="default"
        />
        <MetricCard
          title="الـ CTR"
          value={m.ctr > 0 ? `${m.ctr.toFixed(2)}%` : "—"}
          icon={Gauge}
          variant={m.ctr > 0.8 ? "success" : m.ctr > 0 ? "warning" : "default"}
        />
      </div>

      {/* ── Metrics Sections ───────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {metricSections.map((section) => (
          <Card key={section.title} title={section.title} icon={BarChart3}>
            <div className="grid grid-cols-2 gap-3">
              {section.metrics.map((metric) => (
                <MetricCard
                  key={metric.label}
                  title={metric.label}
                  value={
                    <span
                      className={cn(
                        "text-lg font-bold",
                        metric.tone === "success"
                          ? "text-success-600"
                          : metric.tone === "danger"
                            ? "text-danger-600"
                            : "text-natural-100",
                      )}
                    >
                      {metric.value}
                    </span>
                  }
                />
              ))}
            </div>
          </Card>
        ))}
      </div>

      {/* ── Update Form ────────────────────────────────────────────────── */}
      <Card title="تحديث البيانات" icon={BarChart3}>
        <div className="space-y-5">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <MetricInput
              label="الإنفاق الفعلي"
              icon={<Wallet className="w-3.5 h-3.5" />}
              value={form.budgetSpent ?? 0}
              onChange={(v) => updateField("budgetSpent", v)}
            />
            <MetricInput
              label="العائد المحقق"
              icon={<TrendingUp className="w-3.5 h-3.5" />}
              value={form.revenue ?? 0}
              onChange={(v) => updateField("revenue", v)}
            />
            <MetricInput
              label="إجمالي التحويلات"
              icon={<Target className="w-3.5 h-3.5" />}
              value={form.conversions ?? 0}
              onChange={(v) => updateField("conversions", v)}
            />
            <MetricInput
              label="إجمالي النقرات"
              icon={<MousePointerClick className="w-3.5 h-3.5" />}
              value={form.clicks ?? 0}
              onChange={(v) => updateField("clicks", v)}
            />
            <MetricInput
              label="إجمالي مرات الظهور"
              icon={<Activity className="w-3.5 h-3.5" />}
              value={form.impressions ?? 0}
              onChange={(v) => updateField("impressions", v)}
            />
          </div>

          {hasChanges && (
            <div className="flex items-center gap-3 p-4 rounded-xl bg-secondary-50 border border-secondary-200 text-secondary-700">
              <Zap className="w-5 h-5 shrink-0" />
              <div>
                <p className="font-semibold">هناك تغييرات غير محفوظة.</p>
                <p className="text-sm mt-0.5">اضغط "حفظ التغييرات" لتطبيقها.</p>
              </div>
            </div>
          )}

          <div className="flex items-center gap-3">
            <ActionButton
              onClick={handleSaveMetrics}
              disabled={!hasChanges || isSaving}
              loading={isSaving}
              icon={<Save className="w-4 h-4" />}
            >
              حفظ التغييرات
            </ActionButton>
            <ActionButton
              variant="outline"
              onClick={resetForm}
              disabled={!hasChanges}
              icon={<RotateCcw className="w-4 h-4" />}
            >
              إعادة تعيين
            </ActionButton>
          </div>
        </div>
      </Card>
    </div>
  );
}

// ── Sub-components ───────────────────────────────────────────────────────────

function ProfitabilityBadge({
  profit,
  roas,
}: {
  profit: number;
  roas: number;
}) {
  if (profit > 0)
    return (
      <span className="inline-flex items-center gap-1.5 text-sm font-medium text-success-600 bg-success-50 px-3 py-1 rounded-full">
        <CheckCircle2 className="w-4 h-4" />
        مربحة (ROAS: {roas > 0 ? `${roas.toFixed(2)}x` : "—"})
      </span>
    );
  if (profit < 0)
    return (
      <span className="inline-flex items-center gap-1.5 text-sm font-medium text-danger-600 bg-danger-50 px-3 py-1 rounded-full">
        <TrendingDown className="w-4 h-4" />
        غير مربحة (ROAS: {roas > 0 ? `${roas.toFixed(2)}x` : "—"})
      </span>
    );
  return (
    <span className="inline-flex items-center gap-1.5 text-sm font-medium text-neutral-400 bg-neutral-100 px-3 py-1 rounded-full">
      <Minus className="w-4 h-4" />
      محايد
    </span>
  );
}

function MetricInput({
  label,
  icon,
  value,
  onChange,
}: {
  label: string;
  icon: React.ReactNode;
  value: number;
  onChange: (value: number) => void;
}) {
  return (
    <div className="space-y-1.5">
      <label className="text-xs text-portal-note-text flex items-center gap-1.5">
        {icon}
        {label}
      </label>
      <Input
        type="number"
        min={0}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
      />
    </div>
  );
}

function PageSkeleton() {
  return (
    <div className="space-y-6" dir="rtl">
      <Skeleton className="h-6 w-32" />
      <div className="space-y-2">
        <Skeleton className="h-8 w-3/4" />
        <Skeleton className="h-5 w-40" />
      </div>
      <Skeleton className="h-36 rounded-[30px]" />
      <Skeleton className="h-24 rounded-[30px]" />
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <Skeleton key={i} className="h-28 rounded-[30px]" />
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-64 rounded-[30px]" />
        ))}
      </div>
      <Skeleton className="h-80 rounded-[30px]" />
    </div>
  );
}
