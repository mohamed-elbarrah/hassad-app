import { PageScaffold } from "@/components/patterns/page-scaffold";
import { Skeleton } from "@/components/ui/skeleton";

export default function TeamTaskLoading() {
  return (
    <PageScaffold title="Task detail" description="Loading assigned task detail.">
      <div className="grid gap-4 xl:grid-cols-[minmax(16rem,0.28fr)_minmax(0,1fr)]">
        <Skeleton className="h-96" />
        <div className="flex flex-col gap-4"><Skeleton className="h-28" /><Skeleton className="h-96" /></div>
      </div>
    </PageScaffold>
  );
}
