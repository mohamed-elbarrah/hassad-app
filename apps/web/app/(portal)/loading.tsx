import { PortalSkeleton } from "@/components/portal/PortalSkeleton";

export default function PortalLoading() {
  return (
    <div className="flex flex-col gap-6 p-6">
      <PortalSkeleton className="h-9 w-64" />
      <PortalSkeleton className="h-5 w-80" />
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <PortalSkeleton key={i} className="h-36 rounded-xl" />
        ))}
      </div>
    </div>
  );
}
