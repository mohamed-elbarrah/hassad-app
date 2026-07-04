"use client";

import { Monitor, Database, Activity, Clock, MemoryStick, Server } from "lucide-react";
import { PageIntro } from "@/components/design-system/PageIntro";
import { SurfaceCard } from "@/components/design-system/SurfaceCard";
import { StatCard } from "@/components/design-system/StatCard";
import { Pill } from "@/components/design-system/Pill";
import { Skeleton } from "@/components/design-system/Skeleton";
import { useGetAdminEnvironmentQuery } from "@/features/admin/adminApi";

export default function AdminEnvironmentPage() {
  const { data, isLoading } = useGetAdminEnvironmentQuery();

  if (isLoading) {
    return (
      <div className="flex flex-col gap-6" dir="rtl">
        <Skeleton className="h-10 w-48 rounded-lg" />
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-28 rounded-2xl" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6" dir="rtl">
      <PageIntro title="معلومات البيئة" description="حالة النظام والخدمات الخارجية" icon={Monitor} />

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard title="Node.js" value={data?.nodeVersion ?? "—"} icon={Server} />
        <StatCard title="المنصة" value={data?.platform ?? "—"} icon={Monitor} />
        <StatCard title="وقت التشغيل" value={data?.uptime ? `${Math.floor(data.uptime / 3600)} ساعة` : "—"} icon={Clock} />
        <StatCard title="الترحيلات المعلقة" value={`${data?.pendingMigrations ?? 0}`} icon={Database}
          extra={data?.pendingMigrations > 0 ? <span className="text-xs text-danger-500">يوجد ترحيلات معلقة!</span> : undefined} />
      </div>

      <SurfaceCard title="الخدمات الخارجية">
        <div className="space-y-2">
          {(data?.externalServices ?? []).map((s: any) => (
            <div key={s.id} className="flex items-center justify-between p-4 rounded-2xl border border-portal-divider">
              <div className="flex items-center gap-3">
                <div className={`size-3 rounded-full ${s.status === "UP" ? "bg-success-500" : s.status === "DEGRADED" ? "bg-warning-500" : "bg-danger-500"}`} />
                <div>
                  <p className="text-sm font-medium">{s.serviceName}</p>
                  <p className="text-xs text-portal-note-text">زمن الاستجابة: {s.responseTime}ms</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Pill tone={s.status === "UP" ? "success" : s.status === "DEGRADED" ? "warning" : "danger"}>
                  {s.status === "UP" ? "سليم" : s.status === "DEGRADED" ? "متدهور" : "معطل"}
                </Pill>
                <span className="text-xs text-portal-note-text">{s.lastCheckedAt?.slice(0, 16) ?? ""}</span>
              </div>
            </div>
          ))}
          {(!data?.externalServices || data.externalServices.length === 0) && (
            <p className="text-center text-portal-note-text py-8">لا توجد خدمات خارجية مسجلة</p>
          )}
        </div>
      </SurfaceCard>

      <SurfaceCard title="الذاكرة">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <StatCard title=" RSS" value={data?.memoryUsage?.rss ? `${(data.memoryUsage.rss / 1024 / 1024).toFixed(0)} MB` : "—"} icon={MemoryStick} />
          <StatCard title="Heap Total" value={data?.memoryUsage?.heapTotal ? `${(data.memoryUsage.heapTotal / 1024 / 1024).toFixed(0)} MB` : "—"} icon={MemoryStick} />
          <StatCard title="Heap Used" value={data?.memoryUsage?.heapUsed ? `${(data.memoryUsage.heapUsed / 1024 / 1024).toFixed(0)} MB` : "—"} icon={MemoryStick} />
        </div>
      </SurfaceCard>
    </div>
  );
}
