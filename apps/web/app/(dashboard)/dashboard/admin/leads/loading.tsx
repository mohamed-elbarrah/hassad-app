import { Skeleton } from "@/components/design-system/Skeleton";

export default function Loading() {
  return (
    <div className="flex flex-col gap-5" dir="rtl">
      <Skeleton className="h-8 w-64" />
      <Skeleton className="h-4 w-96" />

      <div className="grid grid-cols-3 gap-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-24 rounded-[30px]" />
        ))}
      </div>

      <Skeleton className="h-10 w-48" />
      <Skeleton className="h-96 rounded-2xl" />
    </div>
  );
}
