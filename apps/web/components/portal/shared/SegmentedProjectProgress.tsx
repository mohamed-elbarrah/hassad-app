import type { ProjectProgressPeriod } from "@/features/portal/portalApi";
import { cn } from "@/lib/utils";
import { getProjectProgressColors } from "./ProjectStatusProgress";

interface SegmentedProjectProgressProps {
  periods: ProjectProgressPeriod[];
  className?: string;
}

const STATUS_LABELS: Record<ProjectProgressPeriod["status"], string> = {
  CLOSED: "مكتملة",
  ACTIVE: "قيد التنفيذ",
  UPCOMING: "لم تبدأ",
  SUSPENDED: "معلقة",
};

export function SegmentedProjectProgress({
  periods,
  className,
}: SegmentedProjectProgressProps) {
  return (
    <div className={cn("flex flex-col gap-2", className)}>
      <div
        className="flex items-center gap-1"
        role="list"
        aria-label="تقدم فترات المشروع"
      >
        {periods.map((period) => {
          const colors = getProjectProgressColors(period.status);
          const progress = Math.max(
            0,
            Math.min(100, period.completionPercentage),
          );
          return (
            <div
              key={period.id}
              role="listitem"
              className="min-w-0 flex-1"
              aria-label={`الفترة ${period.periodNumber}: ${STATUS_LABELS[period.status]}، ${progress}%`}
            >
              <div
                className={cn("h-2 overflow-hidden rounded-full", colors.track)}
                role="progressbar"
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={progress}
                aria-label={`نسبة إنجاز الفترة ${period.periodNumber}`}
              >
                <div
                  className={cn("h-full transition-[width]", colors.fill)}
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
      <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
        {periods.map((period) => (
          <span key={period.id} className="min-w-0 flex-1 truncate text-center">
            الفترة {period.periodNumber}
          </span>
        ))}
      </div>
      <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted-foreground">
        {[
          { status: "CLOSED", label: "مكتملة" },
          { status: "ACTIVE", label: "قيد التنفيذ" },
          { status: "UPCOMING", label: "لم تبدأ" },
          ...(periods.some((period) => period.status === "SUSPENDED")
            ? [{ status: "SUSPENDED", label: "معلقة" }]
            : []),
        ].map(({ status, label }) => (
          <span key={status} className="flex items-center gap-1">
            <span
              className={cn(
                "size-2 rounded-full",
                getProjectProgressColors(status).fill,
              )}
              aria-hidden="true"
            />
            {label}
          </span>
        ))}
      </div>
    </div>
  );
}
