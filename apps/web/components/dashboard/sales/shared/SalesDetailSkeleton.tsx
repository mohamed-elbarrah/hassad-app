"use client";

import { Skeleton } from "@/components/design-system/Skeleton";

type SalesDetailVariant = "contract" | "proposal" | "request" | "client";

interface SalesDetailSkeletonProps {
  variant: SalesDetailVariant;
}

/**
 * Loading skeleton for sales detail pages.
 * Mirrors the portal `DetailSkeleton` pattern with sales‑specific variants.
 */
export function SalesDetailSkeleton({ variant }: SalesDetailSkeletonProps) {
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
