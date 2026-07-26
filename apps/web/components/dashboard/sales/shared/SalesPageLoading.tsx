import { Skeleton } from "@/components/design-system/Skeleton";

/**
 * Route‑level loading skeleton for sales pages.
 * Mirrors the portal `PortalPageLoading` pattern.
 */
export function SalesPageLoading() {
  return (
    <div className="page-shell" dir="rtl">
      <Skeleton className="h-9 w-64 rounded-lg" />
      <Skeleton className="h-5 w-80 rounded-lg" />
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-36 rounded-2xl" />
        ))}
      </div>
    </div>
  );
}
