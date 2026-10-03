import { cn } from "@/lib/utils";

export function getProjectProgressColors(status: string) {
  switch (status) {
    case "CLOSED":
    case "COMPLETED":
      return { track: "bg-success-100", fill: "bg-success-500" };
    case "ACTIVE":
      return { track: "bg-info/15", fill: "bg-info" };
    case "SUSPENDED":
    case "ON_HOLD":
    case "NEEDS_REVISION":
      return { track: "bg-warning/15", fill: "bg-warning-600" };
    case "CANCELLED":
      return { track: "bg-destructive/15", fill: "bg-destructive" };
    case "UPCOMING":
      return { track: "bg-muted", fill: "bg-muted-foreground/30" };
    default:
      return { track: "bg-muted", fill: "bg-muted-foreground/30" };
  }
}

interface ProjectStatusProgressProps {
  value: number;
  status: string;
  label: string;
  className?: string;
}

export function ProjectStatusProgress({
  value,
  status,
  label,
  className,
}: ProjectStatusProgressProps) {
  const progress = Math.max(0, Math.min(100, value));
  const colors = getProjectProgressColors(status);

  return (
    <div
      className={cn(
        "h-2 w-full overflow-hidden rounded-full",
        colors.track,
        className,
      )}
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={progress}
      aria-label={label}
    >
      <div
        className={cn("h-full transition-[width]", colors.fill)}
        style={{ width: `${progress}%` }}
      />
    </div>
  );
}
