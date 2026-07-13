"use client";

import { HeartPulse } from "lucide-react";
import { SurfaceCard } from "@/components/design-system/SurfaceCard";
import { GaugeChart } from "@/components/design-system/GaugeChart";
import { cn } from "@/lib/utils";

interface HealthScoreProps {
  overallScore: number;
  database: "connected" | "disconnected";
  servicesHealthy: number;
  servicesTotal: number;
  recentErrors: number;
  activeUsersLastHour: number;
  unresolvedErrors: number;
  retentionRate: number;
  churnRate: number;
  className?: string;
}

export function HealthScore({
  overallScore,
  database,
  servicesHealthy,
  servicesTotal,
  recentErrors,
  activeUsersLastHour,
  unresolvedErrors,
  retentionRate,
  churnRate,
  className,
}: HealthScoreProps) {
  const dbStatus =
    database === "connected"
      ? { dot: "bg-success-500", text: "متصل" }
      : { dot: "bg-danger-500", text: "منفصل" };

  const serviceStatus = (() => {
    if (servicesTotal === 0) return { dot: "bg-neutral-300", text: "—" };
    const allOk = servicesHealthy >= servicesTotal;
    const halfOk = servicesHealthy >= servicesTotal / 2;
    return {
      dot: allOk ? "bg-success-500" : halfOk ? "bg-alert-500" : "bg-danger-500",
      text: `${servicesHealthy} من ${servicesTotal} تعمل`,
    };
  })();

  const errorStatus = {
    dot: recentErrors > 0 ? "bg-alert-500" : "bg-success-500",
    text: recentErrors > 0 ? `${recentErrors} خطأ` : "لا توجد أخطاء حديثة",
  };

  return (
    <SurfaceCard
      title="صحة المنصة"
      icon={HeartPulse}
      action={
        <a
          href="/dashboard/admin/health"
          className="text-xs text-secondary-500 hover:text-secondary-600"
        >
          عرض صحة النظام ←
        </a>
      }
      className={className}
    >
      <div className="flex flex-col items-center">
        <GaugeChart value={overallScore} max={100} />
        <p className="text-xs text-portal-note-text mt-1">النتيجة الإجمالية</p>
      </div>

      <div className="mt-5 space-y-3 pt-4 border-t border-portal-divider">
        <StatusRow
          dot={dbStatus.dot}
          label="قاعدة البيانات"
          value={dbStatus.text}
        />
        <StatusRow
          dot={serviceStatus.dot}
          label="الخدمات"
          value={serviceStatus.text}
        />
        <StatusRow
          dot={errorStatus.dot}
          label="الأخطاء الحديثة"
          value={errorStatus.text}
        />
        <StatusRow
          dot="bg-blue-500"
          label="المستخدمون النشطون"
          value={`${activeUsersLastHour} آخر ساعة`}
        />
        <StatusRow
          dot={
            retentionRate >= 80
              ? "bg-success-500"
              : retentionRate >= 50
                ? "bg-alert-500"
                : "bg-danger-500"
          }
          label="معدل الاحتفاظ"
          value={`${Math.round(retentionRate)}%`}
        />
        <StatusRow
          dot={
            churnRate <= 10
              ? "bg-success-500"
              : churnRate <= 25
                ? "bg-alert-500"
                : "bg-danger-500"
          }
          label="معدل التوقف"
          value={`${Math.round(churnRate)}%`}
        />
        {unresolvedErrors > 0 && (
          <StatusRow
            dot="bg-danger-500"
            label="أخطاء غير محلولة"
            value={`${unresolvedErrors}`}
          />
        )}
      </div>
    </SurfaceCard>
  );
}

function StatusRow({
  dot,
  label,
  value,
}: {
  dot: string;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        <span className={cn("w-2 h-2 rounded-full shrink-0", dot)} />
        <span className="text-sm text-natural-100">{label}</span>
      </div>
      <span className="text-xs text-portal-note-text">{value}</span>
    </div>
  );
}
