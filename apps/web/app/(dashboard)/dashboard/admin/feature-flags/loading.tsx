import { Skeleton } from "@/components/design-system/Skeleton";

export default function FeatureFlagsLoading() {
  return (
    <div className="flex flex-col gap-6 p-6">
      <Skeleton className="h-9 w-64" />
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-32 rounded-xl" />
        ))}
      </div>
    </div>
  );
}
