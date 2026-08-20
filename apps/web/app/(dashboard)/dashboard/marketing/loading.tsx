import { Skeleton } from "@/components/ui/skeleton";

export default function MarketingLoading() {
  return (
    <div className="flex flex-col gap-8 pb-10" dir="rtl">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <Skeleton className="h-9 w-64" />
          <Skeleton className="h-5 w-48 mt-2" />
        </div>
        <div className="flex gap-3">
          <Skeleton className="h-10 w-32" />
          <Skeleton className="h-10 w-36" />
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-28 rounded-[30px]" />
        ))}
      </div>

      {/* Alerts */}
      <Skeleton className="h-32 rounded-[30px]" />

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <Skeleton className="h-[320px] rounded-[30px]" />
          <Skeleton className="h-[280px] rounded-[30px]" />
        </div>
        <div className="space-y-8">
          <Skeleton className="h-[260px] rounded-[30px]" />
          <Skeleton className="h-[240px] rounded-[30px]" />
          <Skeleton className="h-[200px] rounded-[30px]" />
        </div>
      </div>
    </div>
  );
}
