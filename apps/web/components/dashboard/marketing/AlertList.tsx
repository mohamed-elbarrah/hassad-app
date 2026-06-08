"use client";

import { SurfaceCard } from "@/components/design-system/SurfaceCard";
import { Pill } from "@/components/design-system/Pill";
import { ActionButton } from "@/components/design-system/ActionButton";
import {
  AlertCircle,
  ArrowRight,
  TrendingDown,
  Target,
  MousePointerClick,
} from "lucide-react";
import Link from "next/link";
import { computeMetrics } from "@/lib/marketing-mock";

export function AlertList({ tasks }: { tasks: any[] }) {
  const alerts = tasks.flatMap((task) =>
    (task.campaigns || [])
      .filter((c: any) => c.needsOptimization || c.status === "ACTIVE")
      .map((c: any) => {
        const snapshot = c.kpiSnapshots?.[0] || {};
        const campaignWithMetrics = {
          ...c,
          impressions: snapshot.impressions ?? c.impressions ?? 0,
          clicks: snapshot.clicks ?? c.clicks ?? 0,
          conversions: snapshot.conversions ?? c.conversions ?? 0,
          revenue: snapshot.revenue ?? c.revenue ?? 0,
          budgetSpent: c.budgetSpent ?? 0,
        };
        const metrics = computeMetrics(campaignWithMetrics);

        let reason = "";
        let type: "WARNING" | "CRITICAL" = "WARNING";

        if (c.needsOptimization) {
          reason = "تم تحديدها يدوياً كـ 'تحتاج تحسين'";
          type = "WARNING";
        } else if (
          parseFloat(metrics.roas) < 1 &&
          campaignWithMetrics.budgetSpent > 500
        ) {
          reason = "عائد منخفض جداً (ROAS < 1.0)";
          type = "CRITICAL";
        } else if (
          campaignWithMetrics.clicks > 100 &&
          campaignWithMetrics.conversions === 0
        ) {
          reason = "لا توجد تحويلات رغم وجود نقرات عالية";
          type = "CRITICAL";
        } else if (
          parseFloat(metrics.ctr) < 0.5 &&
          campaignWithMetrics.impressions > 1000
        ) {
          reason = "معدل نقر منخفض جداً (CTR < 0.5%)";
          type = "WARNING";
        }

        return reason ? { task, campaign: c, reason, type, metrics } : null;
      })
      .filter(Boolean),
  );

  if (alerts.length === 0) return null;

  return (
    <SurfaceCard className="border-danger-200 bg-danger-50/30">
      <div className="pb-3">
        <h2 className="text-lg flex items-center gap-2 text-danger-700">
          <AlertCircle className="w-5 h-5" />
          تنبيهات حرجة تحتاج تدخل فوري
        </h2>
      </div>
      <div className="space-y-3">
        {alerts.map((alert: any, idx) => (
          <div
            key={idx}
            className="flex flex-col md:flex-row md:items-center justify-between p-4 bg-white rounded-xl border border-danger-100 shadow-sm gap-4 transition-all hover:shadow-md"
          >
            <div className="flex items-start gap-4">
              <div
                className={`p-2 rounded-lg ${alert.type === "CRITICAL" ? "bg-danger-100 text-danger-600" : "bg-alert-100 text-alert-600"}`}
              >
                {alert.type === "CRITICAL" ? (
                  <TrendingDown className="w-5 h-5" />
                ) : (
                  <AlertCircle className="w-5 h-5" />
                )}
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <h4 className="font-bold text-sm">{alert.campaign.name}</h4>
                  <Pill
                    tone="neutral"
                    className="text-[10px] h-auto px-2 py-0.5"
                  >
                    {alert.task.project?.client?.companyName}
                  </Pill>
                </div>

                <p className="text-xs text-danger-600 font-medium">
                  {alert.reason}
                </p>
                <div className="flex items-center gap-3 mt-2">
                  <span className="text-[10px] text-neutral-300 flex items-center gap-1">
                    <Target className="w-3 h-3" /> ROAS: {alert.metrics.roas}
                  </span>
                  <span className="text-[10px] text-neutral-300 flex items-center gap-1">
                    <MousePointerClick className="w-3 h-3" /> CTR:{" "}
                    {alert.metrics.ctr}%
                  </span>
                </div>
              </div>
            </div>
            <Link href={`/dashboard/marketing/tasks/${alert.task.id}`}>
              <ActionButton
                size="sm"
                variant="outline"
                className="gap-2 border-danger-200 hover:bg-danger-50 text-danger-700"
              >
                مراجعة المهمة
                <ArrowRight className="w-4 h-4" />
              </ActionButton>
            </Link>
          </div>
        ))}
      </div>
    </SurfaceCard>
  );
}
