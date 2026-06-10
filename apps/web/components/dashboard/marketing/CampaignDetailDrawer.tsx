"use client";

import { Dialog } from "@/components/design-system/Dialog";
import { Pill } from "@/components/design-system/Pill";
import { ActionButton } from "@/components/design-system/ActionButton";
import { FormInputControl } from "@/components/design-system/FormInputControl";
import {
  TrendingUp,
  Target,
  MousePointerClick,
  Zap,
  AlertCircle,
  Pause,
  Play,
  Square,
  Copy,
  BarChart3,
  DollarSign,
  Activity,
  ArrowRightLeft,
} from "lucide-react";
import { Campaign, computeMetrics } from "@/lib/marketing-mock";
import {
  useUpdateCampaignMetricsMutation,
  useUpdateCampaignStatusMutation,
  useFlagOptimizationMutation,
  useDuplicateCampaignMutation,
} from "@/features/marketing/marketingApi";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { useState } from "react";

interface CampaignDetailDrawerProps {
  campaign: Campaign | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdate?: (updated: any) => void;
}

function safeNum(n: any): number {
  return typeof n === "number" ? n : 0;
}

export function CampaignDetailDrawer({
  campaign,
  isOpen,
  onClose,
  onUpdate,
}: CampaignDetailDrawerProps) {
  const [updateMetrics, { isLoading: isUpdatingMetrics }] =
    useUpdateCampaignMetricsMutation();
  const [updateStatus, { isLoading: isUpdatingStatus }] =
    useUpdateCampaignStatusMutation();
  const [flagOptimization, { isLoading: isFlagging }] =
    useFlagOptimizationMutation();
  const [duplicate, { isLoading: isDuplicating }] =
    useDuplicateCampaignMutation();

  if (!campaign) return null;

  const normalized = {
    ...campaign,
    impressions: safeNum(campaign.impressions),
    clicks: safeNum(campaign.clicks),
    conversions: safeNum(campaign.conversions),
    revenue: safeNum(campaign.revenue),
    budgetSpent: safeNum(campaign.budgetSpent),
  };
  const metrics = computeMetrics(normalized);
  const isProfitable = parseFloat(metrics.profit) > 0;

  const handleStatusAction = async (
    action: "start" | "pause" | "stop" | "end",
  ) => {
    try {
      await updateStatus({ id: campaign.id, action }).unwrap();
      toast.success("تم تحديث حالة الحملة");
      onClose();
    } catch (err) {
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
    } catch (err) {
      toast.error("فشل التحديث");
    }
  };

  const handleDuplicate = async () => {
    try {
      await duplicate(campaign.id).unwrap();
      toast.success("تم تكرار الحملة بنجاح");
      onClose();
    } catch (err) {
      toast.error("فشل تكرار الحملة");
    }
  };

  const handleMetricChange = async (field: string, value: number) => {
    try {
      await updateMetrics({
        id: campaign.id,
        body: { [field]: value },
      }).unwrap();
    } catch (err) {
      toast.error("فشل تحديث المقاييس");
    }
  };

  return (
    <Dialog
      open={isOpen}
      onOpenChange={onClose}
      title={campaign.name}
      description="تحليل عميق للأداء واتخاذ قرارات تحسين الحملة"
      className="sm:max-w-2xl"
    >
      <div className="space-y-8 mt-8">
        <div className="flex items-center gap-2 mb-2">
          <Pill tone="neutral" className="uppercase font-bold tracking-tighter">
            {campaign.platform}
          </Pill>
          <Pill
            tone={campaign.status === "ACTIVE" ? "success" : "neutral"}
            className={`${campaign.status === "ACTIVE" ? "bg-success-500 text-white" : "bg-neutral-300 text-white"}`}
          >
            {campaign.status}
          </Pill>
        </div>

        {/* Quick Decision Panel */}
        <div className="bg-neutral-50/30 p-4 rounded-xl border border-neutral-300/10 space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-bold flex items-center gap-2 uppercase tracking-wider">
              <Zap className="w-4 h-4 text-secondary-500" />
              الإجراءات السريعة
            </h4>
            {isProfitable ? (
              <Pill
                tone="success"
                className="bg-success-100 text-success-700 border-success-200"
              >
                مربحة ✅
              </Pill>
            ) : (
              <Pill
                tone="danger"
                className="bg-danger-100 text-danger-700 border-danger-200"
              >
                غير مربحة ⚠️
              </Pill>
            )}
          </div>
          <div className="flex flex-wrap gap-2">
            <ActionButton
              size="sm"
              variant={campaign.status === "ACTIVE" ? "outline" : "primary"}
              className="gap-2 shadow-sm"
              onClick={() =>
                handleStatusAction(
                  campaign.status === "ACTIVE" ? "pause" : "start",
                )
              }
              disabled={isUpdatingStatus}
            >
              {campaign.status === "ACTIVE" ? (
                <Pause className="w-4 h-4" />
              ) : (
                <Play className="w-4 h-4" />
              )}
              {campaign.status === "ACTIVE" ? "إيقاف مؤقت" : "تفعيل"}
            </ActionButton>
            <ActionButton
              size="sm"
              variant="outline"
              className="gap-2 border-danger-200 text-danger-700 hover:bg-danger-50 shadow-sm"
              onClick={() => handleStatusAction("stop")}
              disabled={isUpdatingStatus}
            >
              <Square className="w-4 h-4" />
              إنهاء نهائي
            </ActionButton>
            <ActionButton
              size="sm"
              variant="outline"
              className="gap-2 shadow-sm"
              onClick={handleDuplicate}
              disabled={isDuplicating}
            >
              <Copy className="w-4 h-4" />
              تكرار
            </ActionButton>
            <ActionButton
              size="sm"
              variant={campaign.needsOptimization ? "primary" : "outline"}
              className="gap-2 shadow-sm"
              onClick={handleFlagOptimization}
              disabled={isFlagging}
            >
              <AlertCircle className="w-4 h-4" />
              {campaign.needsOptimization ? "تم التحسين" : "يحتاج تحسين"}
            </ActionButton>
          </div>
        </div>

        {/* Deep Analytics Sections */}
        <div className="space-y-6">
          {/* Section 1: Financials & Profitability */}
          <div className="space-y-3">
            <h5 className="text-xs font-bold text-neutral-300 flex items-center gap-2 uppercase tracking-widest">
              <DollarSign className="w-3.5 h-3.5" /> الأداء المالي والربحية
            </h5>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <AnalyticsMetric
                label="الربح الصافي"
                value={`$${metrics.profit}`}
                isGood={isProfitable}
              />
              <AnalyticsMetric
                label="الـ ROAS"
                value={`${metrics.roas}x`}
                isGood={parseFloat(metrics.roas) >= 2}
              />
              <AnalyticsMetric
                label="الإنفاق الكلي"
                value={`$${normalized.budgetSpent}`}
              />
              <AnalyticsMetric
                label="إجمالي العائد"
                value={`$${normalized.revenue}`}
              />
            </div>
          </div>

          <Separator className="opacity-50" />

          {/* Section 2: Conversions & Acquisition */}
          <div className="space-y-3">
            <h5 className="text-xs font-bold text-neutral-300 flex items-center gap-2 uppercase tracking-widest">
              <Target className="w-3.5 h-3.5" /> التحويلات والاستحواذ
            </h5>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <AnalyticsMetric
                label="التحويلات"
                value={normalized.conversions.toString()}
              />
              <AnalyticsMetric
                label="الـ CPA"
                value={`$${metrics.cpa}`}
                isGood={parseFloat(metrics.cpa) < 50}
              />
              <AnalyticsMetric
                label="معدل التحويل"
                value={`${metrics.convRate}%`}
                isGood={parseFloat(metrics.convRate) > 1}
              />
              <AnalyticsMetric label="تكلفة العميل" value={`$${metrics.cpa}`} />
            </div>
          </div>

          <Separator className="opacity-50" />

          {/* Section 3: Engagement & Delivery */}
          <div className="space-y-3">
            <h5 className="text-xs font-bold text-neutral-300 flex items-center gap-2 uppercase tracking-widest">
              <Activity className="w-3.5 h-3.5" /> التفاعل والوصول
            </h5>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <AnalyticsMetric
                label="الظهور"
                value={normalized.impressions.toLocaleString()}
              />
              <AnalyticsMetric
                label="النقرات"
                value={normalized.clicks.toLocaleString()}
              />
              <AnalyticsMetric
                label="الـ CTR"
                value={`${metrics.ctr}%`}
                isGood={parseFloat(metrics.ctr) > 0.8}
              />
              <AnalyticsMetric label="الـ CPM" value={`$${metrics.cpm}`} />
            </div>
          </div>
        </div>

        <Separator />

        {/* Editable Metrics (Data Entry) */}
        <div className="bg-neutral-50/10 p-6 rounded-2xl border border-dashed border-neutral-300/20 space-y-6">
          <div className="flex items-center justify-between">
            <h4 className="font-bold text-sm flex items-center gap-2">
              <BarChart3 className="w-4 h-4" />
              إدخال البيانات الحية (تزامن يدوي)
            </h4>
            <span className="text-[10px] text-neutral-300">
              آخر تحديث: الآن
            </span>
          </div>

          <div className="grid grid-cols-2 gap-x-6 gap-y-4">
            <div className="space-y-2">
              <label className="text-xs text-neutral-300">
                الإنفاق الفعلي (USD)
              </label>
              <div className="relative">
                <FormInputControl
                  type="number"
                  defaultValue={normalized.budgetSpent}
                  onBlur={(e) =>
                    handleMetricChange(
                      "budgetSpent",
                      parseFloat(e.target.value),
                    )
                  }
                  disabled={isUpdatingMetrics}
                  className="pl-8"
                />
                <DollarSign className="w-3 h-3 absolute left-3 top-3 text-neutral-300 opacity-50" />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-xs text-neutral-300">
                العائد المحقق (Revenue)
              </label>
              <div className="relative">
                <FormInputControl
                  type="number"
                  defaultValue={normalized.revenue}
                  onBlur={(e) =>
                    handleMetricChange("revenue", parseFloat(e.target.value))
                  }
                  disabled={isUpdatingMetrics}
                  className="pl-8"
                />
                <TrendingUp className="w-3 h-3 absolute left-3 top-3 text-neutral-300 opacity-50" />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-xs text-neutral-300">
                إجمالي التحويلات
              </label>
              <div className="relative">
                <FormInputControl
                  type="number"
                  defaultValue={normalized.conversions}
                  onBlur={(e) =>
                    handleMetricChange("conversions", parseInt(e.target.value))
                  }
                  disabled={isUpdatingMetrics}
                  className="pl-8"
                />
                <Target className="w-3 h-3 absolute left-3 top-3 text-neutral-300 opacity-50" />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-xs text-neutral-300">إجمالي النقرات</label>
              <div className="relative">
                <FormInputControl
                  type="number"
                  defaultValue={normalized.clicks}
                  onBlur={(e) =>
                    handleMetricChange("clicks", parseInt(e.target.value))
                  }
                  disabled={isUpdatingMetrics}
                  className="pl-8"
                />
                <MousePointerClick className="w-3 h-3 absolute left-3 top-3 text-neutral-300 opacity-50" />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-xs text-neutral-300">
                إجمالي مرات الظهور
              </label>
              <div className="relative">
                <FormInputControl
                  type="number"
                  defaultValue={normalized.impressions}
                  onBlur={(e) =>
                    handleMetricChange("impressions", parseInt(e.target.value))
                  }
                  disabled={isUpdatingMetrics}
                  className="pl-8"
                />
                <ArrowRightLeft className="w-3 h-3 absolute left-3 top-3 text-neutral-300 opacity-50" />
              </div>
            </div>
          </div>

          <ActionButton className="w-full shadow-lg" onClick={onClose}>
            حفظ ومزامنة البيانات
          </ActionButton>
        </div>
      </div>
    </Dialog>
  );
}

function AnalyticsMetric({
  label,
  value,
  isGood,
}: {
  label: string;
  value: string;
  isGood?: boolean;
}) {
  return (
    <div className="bg-natural-0 p-3 rounded-xl border shadow-sm transition-all hover:border-secondary-500/20">
      <p className="text-[10px] text-neutral-300 font-medium mb-1 uppercase tracking-tight">
        {label}
      </p>
      <div className="flex items-center justify-between">
        <span
          className={`text-sm font-bold tracking-tight ${isGood === true ? "text-success-600" : isGood === false ? "text-danger-600" : "text-natural-100"}`}
        >
          {value}
        </span>
      </div>
    </div>
  );
}
