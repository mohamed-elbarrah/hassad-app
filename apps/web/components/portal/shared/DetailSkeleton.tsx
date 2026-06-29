"use client";

import { Skeleton } from "@/components/design-system/Skeleton";

type DetailVariant = "contract" | "invoice" | "proposal" | "project" | "campaign";

interface DetailSkeletonProps {
  variant: DetailVariant;
}

export function DetailSkeleton({ variant }: DetailSkeletonProps) {
  return (
    <div className="flex flex-col gap-5" dir="rtl">
      <Skeleton className="h-5 w-48 rounded-lg" />
      <Skeleton className="h-8 w-64 rounded-lg" />
      <div className="grid gap-5 md:grid-cols-2">
        <Skeleton className="h-40 rounded-2xl" />
        <Skeleton className="h-40 rounded-2xl" />
      </div>
      <Skeleton className="h-60 rounded-2xl" />
    </div>
  );
}
