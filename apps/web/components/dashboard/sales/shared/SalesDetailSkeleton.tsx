"use client";

import { Skeleton } from "@/components/ui/skeleton";

type SalesDetailVariant = "contract" | "proposal" | "request" | "client";

interface SalesDetailSkeletonProps {
  variant: SalesDetailVariant;
}

export function SalesDetailSkeleton({
  variant: _variant,
}: SalesDetailSkeletonProps) {
  return (
    <div className="page-shell" dir="rtl">
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
