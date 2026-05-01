"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AlertCircle, ArrowRight, TrendingDown, Target, MousePointerClick } from "lucide-react";
import Link from "next/link";
import { MarketingTask, computeMetrics } from "@/lib/marketing-mock";

export function AlertList({ tasks }: { tasks: MarketingTask[] }) {
  const alerts = tasks.flatMap(task => 
    task.campaigns
      .filter(c => c.needsOptimization || c.status === "ACTIVE")
      .map(c => {
        const metrics = computeMetrics(c);
        let reason = "";
        let type: "WARNING" | "CRITICAL" = "WARNING";

        if (c.needsOptimization) {
          reason = "تم تحديدها يدوياً كـ 'تحتاج تحسين'";
          type = "WARNING";
        } else if (parseFloat(metrics.roas) < 1 && c.budgetSpent > 500) {
          reason = "عائد منخفض جداً (ROAS < 1.0)";
          type = "CRITICAL";
        } else if (c.clicks > 100 && c.conversions === 0) {
          reason = "لا توجد تحويلات رغم وجود نقرات عالية";
          type = "CRITICAL";
        } else if (parseFloat(metrics.ctr) < 0.5 && c.impressions > 1000) {
          reason = "معدل نقر منخفض جداً (CTR < 0.5%)";
          type = "WARNING";
        }

        return reason ? { task, campaign: c, reason, type, metrics } : null;
      })
      .filter(Boolean)
  );

  if (alerts.length === 0) return null;

  return (
    <Card className="border-rose-200 bg-rose-50/30">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2 text-rose-700">
          <AlertCircle className="w-5 h-5" />
          تنبيهات حرجة تحتاج تدخل فوري
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {alerts.map((alert: any, idx) => (
          <div key={idx} className="flex flex-col md:flex-row md:items-center justify-between p-4 bg-white rounded-xl border border-rose-100 shadow-sm gap-4 transition-all hover:shadow-md">
            <div className="flex items-start gap-4">
              <div className={`p-2 rounded-lg ${alert.type === 'CRITICAL' ? 'bg-rose-100 text-rose-600' : 'bg-amber-100 text-amber-600'}`}>
                {alert.type === 'CRITICAL' ? <TrendingDown className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <h4 className="font-bold text-sm">{alert.campaign.name}</h4>
                  <Badge variant="outline" className="text-[10px] bg-slate-50">{alert.task.client}</Badge>
                </div>
                <p className="text-xs text-rose-600 font-medium">{alert.reason}</p>
                <div className="flex items-center gap-3 mt-2">
                  <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                    <Target className="w-3 h-3" /> ROAS: {alert.metrics.roas}
                  </span>
                  <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                    <MousePointerClick className="w-3 h-3" /> CTR: {alert.metrics.ctr}%
                  </span>
                </div>
              </div>
            </div>
            <Link href={`/dashboard/marketing/tasks/${alert.task.id}`}>
              <Button size="sm" variant="outline" className="gap-2 border-rose-200 hover:bg-rose-50 text-rose-700">
                مراجعة المهمة
                <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
