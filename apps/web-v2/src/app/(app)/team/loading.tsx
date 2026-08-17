import { PageScaffold } from "@/components/patterns/page-scaffold";
import { Skeleton } from "@/components/ui/skeleton";

export default function TeamLoading() {
  return (
    <PageScaffold title="Loading my work" description="Preparing your assigned task board.">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => <Skeleton key={index} className="h-28" />)}
      </div>
      <Skeleton className="h-96" />
    </PageScaffold>
  );
}
