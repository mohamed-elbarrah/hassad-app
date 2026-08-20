import { Skeleton } from "@/components/ui/skeleton";

export function ClientsTableSkeleton() {
  return (
    <div className="space-y-3">
      {/* Table header skeleton */}
      <div className="flex items-center gap-4 pb-2">
        <Skeleton className="h-9 w-64 rounded-lg" />
        <Skeleton className="h-9 w-40 rounded-lg" />
        <Skeleton className="ms-auto h-9 w-32 rounded-lg" />
      </div>

      {/* Rows */}
      <div className="rounded-card border border-border-default overflow-hidden">
        {/* Header row */}
        <div className="flex items-center gap-4 border-b-[1.5px] border-portal-divider p-3">
          {[120, 160, 100, 90, 100, 110, 80].map((w, i) => (
            <Skeleton key={i} className={`h-4 rounded w-[${w}px]`} />
          ))}
        </div>

        {/* Data rows */}
        {Array.from({ length: 8 }).map((_, rowIndex) => (
          <div
            key={rowIndex}
            className="flex items-center gap-4 border-b-[1.5px] border-portal-divider p-3 last:border-b-0"
          >
            {[120, 160, 100, 90, 100, 110, 80].map((w, i) => (
              <Skeleton key={i} className={`h-4 rounded w-[${w}px]`} />
            ))}
          </div>
        ))}
      </div>

      {/* Pagination skeleton */}
      <div className="flex items-center justify-between pt-2">
        <Skeleton className="h-4 w-40 rounded" />
        <div className="flex gap-2">
          <Skeleton className="h-9 w-20 rounded-xl" />
          <Skeleton className="h-9 w-20 rounded-xl" />
        </div>
      </div>
    </div>
  );
}
