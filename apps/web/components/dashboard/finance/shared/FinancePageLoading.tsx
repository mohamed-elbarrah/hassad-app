"use client";

import { Skeleton } from "@/components/design-system/Skeleton";

export function FinancePageLoading() {
  return (
    <div className="flex flex-col gap-5 pb-10" dir="rtl">
      <Skeleton className="h-9 w-64" />
      <Skeleton className="h-5 w-96 mt-1" />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-28 rounded-[30px]" />
        ))}
      </div>

      <Skeleton className="h-12 w-full rounded-[30px]" />

      <Skeleton className="h-80 w-full rounded-[30px]" />
    </div>
  );
}
