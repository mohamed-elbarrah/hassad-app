import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";

interface PortalSkeletonProps {
  className?: string;
  children?: React.ReactNode;
}

export function PortalSkeleton({ className, children }: PortalSkeletonProps) {
  return (
    <Skeleton
      className={cn(
        "bg-neutral-100/80 rounded-xl",
        className,
      )}
    >
      {children}
    </Skeleton>
  );
}
