"use client";

import { Skeleton } from "@/components/design-system/Skeleton";

interface PmDetailSkeletonProps {
  variant?: "project" | "task" | "dispute";
}

export function PmDetailSkeleton({
  variant = "project",
}: PmDetailSkeletonProps) {
  return (
    <div className="flex flex-col gap-5 max-w-4xl" dir="rtl">
      <Skeleton className="h-5 w-48" />
      <Skeleton className="h-8 w-64" />
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-24 rounded-2xl" />
        ))}
      </div>
      <Skeleton className="h-96 rounded-2xl" />
    </div>
  );
}
