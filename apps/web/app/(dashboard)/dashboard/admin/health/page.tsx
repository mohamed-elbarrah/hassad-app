"use client";

import { useGetHealthQuery } from "@/features/admin/adminApi";
import { PageIntro } from "@/components/design-system/PageIntro";
import { StatCard } from "@/components/design-system/StatCard";
import { StatusBanner } from "@/components/design-system/StatusBanner";
import { ActionButton } from "@/components/design-system/ActionButton";
import { Skeleton } from "@/components/design-system/Skeleton";
import { Activity, Database, Users, Clock, Zap, AlertTriangle, RefreshCw } from "lucide-react";

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatUptime(seconds: number) {
  const d = Math.floor(seconds / 86400);
  const h = Math.floor((seconds % 86400) / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (d > 0) return `${d}ي ${h}س ${m}د`;
  if (h > 0) return `${h}س ${m}د`;
  return `${m}د`;
}

export default function HealthPage() {
  const { data, isLoading, isError, refetch } = useGetHealthQuery();

  return (
    <div className="flex flex-col gap-6" dir="rtl">
      <PageIntro
        title="صحة النظام"
        description="مراقبة أداء الخادم وقاعدة البيانات"
        icon={Activity}
        actions={
          <ActionButton variant="outline" size="md" onClick={() => refetch()}>
            <RefreshCw className="size-4 mr-1" />
            تحديث
          </ActionButton>
        }
      />

      {isLoading && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-32 rounded-[30px]" />
          ))}
        </div>
      )}

      {isError && (
        <StatusBanner variant="danger" title="تعذر الاتصال بالخادم">
          يرجى التحقق من حالة الخادم والمحاولة لاحقاً
        </StatusBanner>
      )}

      {data && !isLoading && (
        <>
          {/* Status Banner */}
          <StatusBanner
            variant={data.status === "healthy" ? "success" : "warning"}
            title={data.status === "healthy" ? "الخادم سليم" : "الخادم متدهور"}
          >
            آخر فحص: {new Date(data.timestamp).toLocaleString("ar-SA-u-nu-latn")}
          </StatusBanner>

          {/* Core Metrics */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              title="قاعدة البيانات"
              value={data.database === "connected" ? "متصل" : "منقطع"}
              icon={Database}
              variant={data.database === "connected" ? "success" : "danger"}
            />
            <StatCard
              title="مستخدمين نشطين"
              value={data.activeUsersLastHour}
              icon={Users}
            />
            <StatCard
              title="وقت التشغيل"
              value={formatUptime(data.uptime)}
              icon={Clock}
            />
            <StatCard
              title="الذاكرة"
              value={formatBytes(data.memoryUsage)}
              icon={Zap}
            />
          </div>

          {/* Secondary Metrics */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              title="أخطاء الساعة الأخيرة"
              value={data.recentErrors}
              icon={AlertTriangle}
              variant={data.recentErrors > 0 ? "danger" : "success"}
            />
            <StatCard
              title="Webhooks معلقة"
              value={data.pendingWebhooks}
              icon={RefreshCw}
              variant={data.pendingWebhooks > 0 ? "warning" : "success"}
            />
            <StatCard
              title="وقت الخادم"
              value={new Date(data.timestamp).toLocaleTimeString("ar-SA-u-nu-latn")}
              icon={Clock}
            />
            <StatCard
              title="حالة عامة"
              value={data.status === "healthy" ? "سليم" : "متدهور"}
              icon={Activity}
              variant={data.status === "healthy" ? "success" : "warning"}
            />
          </div>
        </>
      )}
    </div>
  );
}
