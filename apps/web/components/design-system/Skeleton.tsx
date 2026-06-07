import { cn } from "@/lib/utils";
import { Skeleton as BaseSkeleton } from "@/components/ui/skeleton";

export function Skeleton({
  className,
  children,
  style,
  ...rest
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <BaseSkeleton
      className={cn(
        "bg-neutral-100/80 rounded-xl",
        className,
      )}
      style={style}
      {...rest}
    >
      {children}
    </BaseSkeleton>
  );
}
