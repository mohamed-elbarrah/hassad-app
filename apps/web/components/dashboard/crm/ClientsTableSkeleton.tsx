import { Skeleton } from "@/components/ui/skeleton";

export function ClientsTableSkeleton() {
  return (
    <div className="space-y-3">
      {/* Table header skeleton */}
      <div className="flex items-center gap-4 pb-2">
        <Skeleton className="h-9 w-64" />
        <Skeleton className="h-9 w-40" />
        <Skeleton className="ms-auto h-9 w-32" />
      </div>

      {/* Rows */}
      <div className="rounded-md border">
        {/* Header row */}
        <div className="flex items-center gap-4 border-b p-3">
          {[120, 160, 100, 90, 100, 110, 80].map((w, i) => (
            <Skeleton key={i} className="h-4" style={{ width: w }} />
          ))}
        </div>

        {/* Data rows */}
        {Array.from({ length: 8 }).map((_, rowIndex) => (
          <div
            key={rowIndex}
            className="flex items-center gap-4 border-b p-3 last:border-b-0"
          >
            {[120, 160, 100, 90, 100, 110, 80].map((w, i) => (
              <Skeleton key={i} className="h-4" style={{ width: w }} />
            ))}
          </div>
        ))}
      </div>

      {/* Pagination skeleton */}
      <div className="flex items-center justify-between pt-2">
        <Skeleton className="h-4 w-40" />
        <div className="flex gap-2">
          <Skeleton className="h-9 w-20" />
          <Skeleton className="h-9 w-20" />
        </div>
      </div>
    </div>
  );
}
