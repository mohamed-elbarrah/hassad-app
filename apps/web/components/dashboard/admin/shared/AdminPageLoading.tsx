"use client";

import { Skeleton } from "@/components/design-system/Skeleton";

export function AdminPageLoading() {
  return (
    <div className="space-y-6" dir="rtl">
      {/* Row 1: PeriodSelector */}
      <Skeleton className="h-12 w-full max-w-md rounded-[14px]" />

      {/* Row 2: KpiGrid — 8 cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-8 gap-3">
        {Array.from({ length: 8 }).map((_, i) => (
          <Skeleton key={i} className="h-28 rounded-[20px]" />
        ))}
      </div>

      {/* Row 3: AlertPanel + TrendChart */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        <div className="lg:col-span-2 space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-16 rounded-[16px]" />
          ))}
        </div>
        <div className="lg:col-span-3">
          <Skeleton className="h-80 rounded-[30px]" />
        </div>
      </div>

      {/* Row 4: FunnelChart + ContractChart */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Skeleton className="h-80 rounded-[30px]" />
        <Skeleton className="h-80 rounded-[30px]" />
      </div>

      {/* Row 5: HealthScore + ActivityFeed */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        <div className="lg:col-span-2">
          <Skeleton className="h-80 rounded-[30px]" />
        </div>
        <div className="lg:col-span-3">
          <Skeleton className="h-80 rounded-[30px]" />
        </div>
      </div>

      {/* Row 6: QuickActions + BusinessStats */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Skeleton className="h-48 rounded-[30px]" />
        <Skeleton className="h-48 rounded-[30px]" />
      </div>
    </div>
  );
}
