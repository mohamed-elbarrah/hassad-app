import { PageScaffold } from "@/components/patterns/page-scaffold";
import { Skeleton } from "@/components/ui/skeleton";

export default function AdminLoading() {
  return (
    <PageScaffold title="Loading workspace" description="Preparing the admin overview.">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <Skeleton key={index} className="h-28" />
        ))}
      </div>
      <Skeleton className="h-80" />
    </PageScaffold>
  );
}
