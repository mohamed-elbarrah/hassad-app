"use client";

import { useState } from "react";
import {
  Brain,
  Lightbulb,
  Sparkles,
  ArrowLeft,
  Loader2,
  RefreshCw,
} from "lucide-react";
import { SurfaceCard } from "@/components/design-system/SurfaceCard";
import {
  useGetAdminAiInsightsQuery,
  useRunAdminAiScanMutation,
} from "@/features/admin/adminApi";
import type { AdminAiInsightEntry } from "@/features/admin/adminApi";
import { cn } from "@/lib/utils";

const ANALYSIS_LABELS: Record<string, string> = {
  CHURN_PREDICTION: "توقع انسحاب",
  SENTIMENT_ANALYSIS: "تحليل المشاعر",
  PERFORMANCE_FORECAST: "توقع الأداء",
  CONTENT_GENERATION: "توليد محتوى",
  QUALITY_CHECK: "فحص الجودة",
};

const ENTITY_LABELS: Record<string, string> = {
  LEAD: "عميل متوقع",
  CLIENT: "عميل",
  PROJECT: "مشروع",
  TASK: "مهمة",
};

function AnalysisCard({ entry }: { entry: AdminAiInsightEntry }) {
  const scoreColor =
    entry.score != null
      ? entry.score >= 70
        ? "text-success-600"
        : entry.score >= 40
          ? "text-alert-600"
          : "text-danger-600"
      : "text-portal-note-text";

  return (
    <div className="p-3 rounded-xl border border-portal-divider bg-white space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles className="w-3.5 h-3.5 text-secondary-500" />
          <span className="text-xs font-medium text-secondary-500">
            {ENTITY_LABELS[entry.entityType] || entry.entityType}
          </span>
          <span className="text-xs text-portal-note-text">·</span>
          <span className="text-xs text-portal-note-text">
            {ANALYSIS_LABELS[entry.analysisType] || entry.analysisType}
          </span>
        </div>
        {entry.score != null && (
          <span className={cn("text-xs font-semibold", scoreColor)}>
            {entry.score}%
          </span>
        )}
      </div>
      <p className="text-xs text-natural-100 leading-relaxed line-clamp-2">
        {entry.summary || "—"}
      </p>
      {entry.recommendations.length > 0 && (
        <div className="text-xs text-portal-note-text">
          <span className="font-medium">التوصيات: </span>
          {entry.recommendations.slice(0, 2).join(" · ")}
          {entry.recommendations.length > 2 && (
            <span> +{entry.recommendations.length - 2}</span>
          )}
        </div>
      )}
    </div>
  );
}

export function AiInsightsCard({ className }: { className?: string }) {
  const { data, isLoading, refetch } = useGetAdminAiInsightsQuery();
  const [runScan, { isLoading: scanning }] = useRunAdminAiScanMutation();
  const [scanResult, setScanResult] = useState<{
    analyzed: number;
    failed: number;
  } | null>(null);

  async function handleScan() {
    setScanResult(null);
    try {
      const result = await runScan().unwrap();
      setScanResult(result);
      refetch();
    } catch {
      setScanResult({ analyzed: 0, failed: 0 });
    }
  }

  return (
    <SurfaceCard
      title="التحليلات الذكية"
      icon={Brain}
      action={
        <button
          type="button"
          onClick={handleScan}
          disabled={scanning}
          className="flex items-center gap-1.5 px-3 h-8 rounded-lg border border-secondary-200 text-xs text-secondary-600 hover:bg-secondary-50 disabled:opacity-50 transition-colors"
        >
          {scanning ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <RefreshCw className="w-3.5 h-3.5" />
          )}
          {scanning ? "جاري التحليل..." : "تشغيل تحليل شامل"}
        </button>
      }
      className={className}
    >
      {scanResult && (
        <div
          className={cn(
            "p-3 rounded-xl border text-xs flex items-center gap-2",
            scanResult.analyzed > 0
              ? "bg-success-50 border-success-200 text-success-700"
              : "bg-alert-50 border-alert-200 text-alert-700",
          )}
        >
          {scanResult.analyzed > 0
            ? `تم تحليل ${scanResult.analyzed} عنصر${scanResult.analyzed > 1 ? "اً" : ""} بنجاح`
            : "تعذر التحليل — تأكد من إعداد مزود AI"}
          {scanResult.failed > 0 && ` (فشل ${scanResult.failed})`}
        </div>
      )}

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              className="h-24 rounded-xl bg-badge-gray-bg animate-pulse"
            />
          ))}
        </div>
      ) : !data || data.recentAnalyses.length === 0 ? (
        <div className="text-center py-8">
          <Brain className="w-10 h-10 mx-auto mb-2 text-portal-note-text opacity-40" />
          <p className="text-sm text-portal-note-text">لا توجد تحليلات بعد</p>
          <p className="text-xs text-portal-note-text mt-1 mb-4">
            اضغط "تشغيل تحليل شامل" لفحص العملاء المتوقعين والعملاء والمشاريع
            والمهام
          </p>
          <button
            type="button"
            onClick={handleScan}
            disabled={scanning}
            className="inline-flex items-center gap-2 px-4 h-10 bg-secondary-500 text-white rounded-xl text-sm hover:opacity-90 disabled:opacity-50 transition-opacity"
          >
            {scanning ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <RefreshCw className="w-4 h-4" />
            )}
            {scanning ? "جاري التحليل..." : "تشغيل تحليل شامل"}
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {data.recentAnalyses.map((entry) => (
            <AnalysisCard key={entry.id} entry={entry} />
          ))}

          {data.pendingSuggestions > 0 && (
            <a
              href="/dashboard/admin/ai/suggestions"
              className="flex items-center justify-between p-3 rounded-xl bg-alert-50 border border-alert-200 text-xs"
            >
              <div className="flex items-center gap-2">
                <Lightbulb className="w-4 h-4 text-alert-600" />
                <span className="text-alert-700 font-medium">
                  {data.pendingSuggestions} اقتراح
                  {data.pendingSuggestions > 1 ? "ات" : ""} ذكي بانتظار المراجعة
                </span>
              </div>
              <ArrowLeft className="w-3.5 h-3.5 text-alert-600" />
            </a>
          )}
        </div>
      )}
    </SurfaceCard>
  );
}
