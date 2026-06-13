"use client";

import { useState, useMemo, useCallback } from "react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

// Design-system
import { Dialog } from "@/components/design-system/Dialog";
import { StatusBadge } from "@/components/design-system/StatusBadge";
import { ActionButton } from "@/components/design-system/ActionButton";
import { InfoPanel } from "@/components/design-system/InfoPanel";
import { KpiPill } from "@/components/design-system/KpiPill";
import { ProgressBar } from "@/components/design-system/ProgressBar";
import { FormInputControl } from "@/components/design-system/FormInputControl";
import { Skeleton } from "@/components/design-system/Skeleton";

// API
import {
  useUpdateCampaignMetricsMutation,
  useUpdateCampaignStatusMutation,
  useFlagOptimizationMutation,
  useDuplicateCampaignMutation,
} from "@/features/marketing/marketingApi";

// Format
import { formatCurrency, formatNumber } from "@/lib/format";

// Icons
import {
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
  ArrowRightLeft,
  Wallet,
  CheckCircle2,
  Eye,
  Save,
  RotateCcw,
} from "lucide-react";

// ── Constants ───────────────────────────────────────────────────────────────

const CAMPAIGN_STATUS_LABELS: Record<string, string> = {
  PLANNING: "تخطيط",
  ACTIVE: "نشطة",
  PAUSED: "متوقفة",
  STOPPED: "منتهية",
  COMPLETED: "مكتملة",
};

const CAMPAIGN_STATUS_BADGE: Record<string, string> = {
  PLANNING: "PENDING",
  ACTIVE: "ACTIVE",
  PAUSED: "WARNING",
  STOPPED: "DANGER",
  COMPLETED: "COMPLETED",
};

const PLATFORM_LABELS: Record<string, string> = {
  GOOGLE: "Google Ads",
  META: "Meta Ads",
  TIKTOK: "TikTok Ads",
  SNAPCHAT: "Snapchat Ads",
};

// ── Types ───────────────────────────────────────────────────────────────────

interface CampaignDetailDrawerProps {
  campaign: any;
  isOpen: boolean;
  onClose: () => void;
}

interface MetricSection {
  title: string;
  icon: React.ReactNode;
  metrics: { label: string; value: string; tone?: "success" | "danger" | "neutral" }[];
}

// ── Helper: compute metrics from raw campaign data ────────────────────────────

function computeCampaignMetrics(c: any) {
  const budgetSpent = Number(c.budgetSpent ?? 0);
  const revenue = Number(c.revenue ?? 0);
  const impressions = Number(c.impressions ?? 0);
  const clicks = Number(c.clicks ?? 0);
  const conversions = Number(c.conversions ?? 0);

  const roas = budgetSpent > 0 ? revenue / budgetSpent : 0;
  const ctr = impressions > 0 ? (clicks / impressions) * 100 : 0;
  const cpc = clicks > 0 ? budgetSpent / clicks : 0;
  const cpa = conversions > 0 ? budgetSpent / conversions : 0;
  const convRate = clicks > 0 ? (conversions / clicks) * 100 : 0;
  const cpm = impressions > 0 ? (budgetSpent / impressions) * 1000 : 0;
  const profit = revenue - budgetSpent;

  return {
    roas,
    ctr,
    cpc,
    cpa,
    convRate,
    cpm,
    profit,
    budgetSpent,
    revenue,
    impressions,
    clicks,
    conversions,
  };
}

// ── Component ─────────────────────────────────────────────────────────────────

export function CampaignDetailDrawer({
  campaign,
  isOpen,
  onClose,
}: CampaignDetailDrawerProps) {
  const [updateMetrics, { isLoading: isSaving }] =
    useUpdateCampaignMetricsMutation();
  const [updateStatus, { isLoading: isUpdatingStatus }] =
    useUpdateCampaignStatusMutation();
  const [flagOptimization, { isLoading: isFlagging }] =
    useFlagOptimizationMutation();
  const [duplicate, { isLoading: isDuplicating }] =
    useDuplicateCampaignMutation();

  // Form state (controlled — batch save)
  const [form, setForm] = useState<Record<string, number>>({});
  const [hasChanges, setHasChanges] = useState(false);

  // Reset form when campaign changes
  const resetForm = useCallback(() => {
    if (!campaign) return;
    setForm({
      budgetSpent: Number(campaign.budgetSpent ?? 0),
      revenue: Number(campaign.revenue ?? 0),
      impressions: Number(campaign.impressions ?? 0),
      clicks: Number(campaign.clicks ?? 0),
      conversions: Number(campaign.conversions ?? 0),
    });
    setHasChanges(false);
  }, [campaign]);

  // Initialise / reset on open
  useMemo(() => {
    if (isOpen) resetForm();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, campaign?.id]);

  if (!campaign) return null;

  const m = computeCampaignMetrics({ ...campaign, ...form });
  const budgetPct =
    campaign.budgetTotal > 0
      ? Math.min(100, (m.budgetSpent / campaign.budgetTotal) * 100)
      : 0;

  const isProfitable = m.profit > 0;
  const isRoasGood = m.roas >= 2;
  const isRoasBad = m.roas > 0 && m.roas < 1;

  // ── Actions ────────────────────────────────────────────────────────────────

  const handleStatusAction = async (
    action: "start" | "pause" | "stop" | "end",
  ) => {
    try {
      await updateStatus({ id: campaign.id, action }).unwrap();
      toast.success("تم تحديث حالة الحملة");
      onClose();
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
      onClose();
    } catch {
      toast.error("فشل تكرار الحملة");
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

  const sections: MetricSection[] = [
    {
      title: "الأداء المالي والربحية",
      icon: <DollarSign className="w-3.5 h-3.5" />,
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
        {
          label: "الإنفاق الكلي",
          value: formatCurrency(m.budgetSpent),
        },
        {
          label: "إجمالي العائد",
          value: formatCurrency(m.revenue),
        },
      ],
    },
    {
      title: "التحويلات والاستحواذ",
      icon: <Target className="w-3.5 h-3.5" />,
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
          tone: m.convRate > 1 ? "success" : m.convRate > 0 ? "danger" : "neutral",
        },
        {
          label: "تكلفة العميل",
          value: m.cpa > 0 ? formatCurrency(m.cpa) : "—",
        },
      ],
    },
    {
      title: "التفاعل والوصول",
      icon: <Activity className="w-3.5 h-3.5" />,
      metrics: [
        { label: "الظهور", value: formatNumber(m.impressions) },
        { label: "النقرات", value: formatNumber(m.clicks) },
        {
          label: "الـ CTR",
          value: m.ctr > 0 ? `${m.ctr.toFixed(2)}%` : "—",
          tone: m.ctr > 0.8 ? "success" : m.ctr > 0 ? "danger" : "neutral",
        },
        {
          label: "الـ CPM",
          value: m.cpm > 0 ? formatCurrency(m.cpm) : "—",
        },
      ],
    },
  ];

  const canStart = campaign.status === "PLANNING";
  const canPause = campaign.status === "ACTIVE";
  const canStop =
    campaign.status === "ACTIVE" || campaign.status === "PAUSED";

  return (
    <Dialog
      open={isOpen}
      onOpenChange={onClose}
      title={campaign.name}
      description={`${PLATFORM_LABELS[campaign.platform] || campaign.platform} · إدارة الحملة وتحديث المقاييس`}
      className="sm:max-w-2xl"
      footer={
        <div className="flex items-center justify-between w-full">
          <ActionButton
            variant="outline"
            size="sm"
            onClick={onClose}
            className="gap-1"
          >
            إغلاق
          </ActionButton>
          {hasChanges && (
            <ActionButton
              size="sm"
              onClick={handleSaveMetrics}
              disabled={isSaving}
              loading={isSaving}
              icon={<Save className="w-4 h-4" />}
            >
              حفظ التغييرات
            </ActionButton>
          )}
        </div>
      }
    >
      <div className="space-y-6">
        {/* Header row: platform + status + profitability */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <StatusBadge
              status={CAMPAIGN_STATUS_BADGE[campaign.status] || "PENDING"}
              label={CAMPAIGN_STATUS_LABELS[campaign.status] || campaign.status}
            />
            <span className="text-xs text-portal-note-text">
              {PLATFORM_LABELS[campaign.platform] || campaign.platform}
            </span>
          </div>
          <ProfitabilityBadge
            profit={m.profit}
            roas={m.roas}
          />
        </div>

        {/* Budget bar */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs">
            <span className="text-portal-note-text">استهلاك الميزانية</span>
            <span className="font-medium text-natural-100">
              {formatCurrency(m.budgetSpent)} /{" "}
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
            showLabel
          />
        </div>

        {/* Quick actions */}
        <div className="space-y-3">
          <h4 className="text-sm font-semibold text-natural-100 flex items-center gap-2">
            <Zap className="w-4 h-4 text-secondary-500" />
            الإجراءات السريعة
          </h4>
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
              {campaign.needsOptimization
                ? "إلغاء علامة التحسين"
                : "يحتاج تحسين"}
            </ActionButton>
          </div>
        </div>

        {/* Needs optimization warning */}
        {campaign.needsOptimization && (
          <div className="flex items-center gap-2 p-3 rounded-xl bg-danger-50 border border-danger-200 text-danger-700 text-sm">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>تم وضع علامة "تحتاج تحسين" على هذه الحملة.</span>
          </div>
        )}

        {/* Metrics sections */}
        <div className="space-y-5">
          {sections.map((section) => (
            <div key={section.title} className="space-y-3">
              <h5 className="text-xs font-bold text-portal-note-text flex items-center gap-2 uppercase tracking-wider">
                {section.icon}
                {section.title}
              </h5>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {section.metrics.map((metric) => (
                  <InfoPanel
                    key={metric.label}
                    variant="bordered"
                    className="text-center p-3"
                  >
                    <p className="text-[10px] text-portal-note-text mb-1">
                      {metric.label}
                    </p>
                    <p
                      className={cn(
                        "text-sm font-bold",
                        metric.tone === "success"
                          ? "text-success-600"
                          : metric.tone === "danger"
                            ? "text-danger-600"
                            : "text-natural-100"
                      )}
                    >
                      {metric.value}
                    </p>
                  </InfoPanel>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Editable metrics form */}
        <div className="space-y-4 pt-4 border-t border-portal-divider">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-semibold text-natural-100 flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-secondary-500" />
              تحديث البيانات
            </h4>
            <ActionButton
              size="sm"
              variant="ghost"
              onClick={resetForm}
              disabled={!hasChanges}
              className="gap-1 text-xs"
              icon={<RotateCcw className="w-3.5 h-3.5" />}
            >
              إعادة تعيين
            </ActionButton>
          </div>

          <div className="grid grid-cols-2 gap-4">
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
              icon={<ArrowRightLeft className="w-3.5 h-3.5" />}
              value={form.impressions ?? 0}
              onChange={(v) => updateField("impressions", v)}
            />
          </div>

          {hasChanges && (
            <div className="flex items-center gap-2 p-3 rounded-xl bg-secondary-50 border border-secondary-200 text-secondary-700 text-sm">
              <Zap className="w-4 h-4 shrink-0" />
              <span>
                هناك تغييرات غير محفوظة. اضغط "حفظ التغييرات" في الأسفل.
              </span>
            </div>
          )}
        </div>
      </div>
    </Dialog>
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
      <span className="inline-flex items-center gap-1 text-xs font-medium text-success-600 bg-success-50 px-2 py-0.5 rounded-full">
        <CheckCircle2 className="w-3.5 h-3.5" />
        مربحة
      </span>
    );
  if (profit < 0)
    return (
      <span className="inline-flex items-center gap-1 text-xs font-medium text-danger-600 bg-danger-50 px-2 py-0.5 rounded-full">
        <TrendingDown className="w-3.5 h-3.5" />
        غير مربحة
      </span>
    );
  return (
    <span className="inline-flex items-center gap-1 text-xs font-medium text-neutral-400 bg-neutral-100 px-2 py-0.5 rounded-full">
      <Minus className="w-3.5 h-3.5" />
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
      <FormInputControl
        type="number"
        min={0}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
        className="text-left"
      />
    </div>
  );
}
