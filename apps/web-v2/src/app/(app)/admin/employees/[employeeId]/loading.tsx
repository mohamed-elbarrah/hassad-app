import { PageScaffold } from "@/components/patterns/page-scaffold";
import { Skeleton } from "@/components/ui/skeleton";

export default function EmployeeDetailLoading() {
  return (
    <PageScaffold title="Loading employee" description="Preparing employee detail.">
      <div className="grid gap-4 xl:grid-cols-[minmax(0,0.38fr)_minmax(0,1fr)]">
        <Skeleton className="h-72" />
        <Skeleton className="h-72" />
      </div>
      <Skeleton className="h-64" />
    </PageScaffold>
  );
}
