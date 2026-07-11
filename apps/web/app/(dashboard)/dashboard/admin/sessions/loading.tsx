import { Skeleton } from "@/components/design-system/Skeleton";

export default function AdminSessionsLoading() {
  return (
    <div className="flex flex-col gap-6 p-6" dir="rtl">
      <div className="h-8 w-48 animate-pulse rounded-lg bg-neutral-100" />
      <div className="h-4 w-72 animate-pulse rounded-lg bg-neutral-100" />
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-28 rounded-[30px]" />
        ))}
      </div>
      <div className="h-12 w-full animate-pulse rounded-2xl bg-neutral-100" />
      <div className="space-y-3">
        {Array.from({ length: 8 }).map((_, i) => (
          <div
            key={i}
            className="h-16 w-full animate-pulse rounded-2xl bg-neutral-100"
          />
        ))}
      </div>
    </div>
  );
}
