"use client";

import { Skeleton } from "@/components/ui/skeleton";

export function AdminPageLoading() {
  return (
    <div className="flex flex-col gap-6">
      <Skeleton className="h-36 w-full rounded-2xl" />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 8 }).map((_, index) => (
          <Skeleton key={index} className="h-40 rounded-2xl" />
        ))}
      </div>
      <div className="grid gap-6 xl:grid-cols-5">
        <Skeleton className="h-96 rounded-2xl xl:col-span-2" />
        <Skeleton className="h-96 rounded-2xl xl:col-span-3" />
      </div>
      <div className="grid gap-6 xl:grid-cols-2">
        <Skeleton className="h-80 rounded-2xl" />
        <Skeleton className="h-80 rounded-2xl" />
      </div>
    </div>
  );
}
