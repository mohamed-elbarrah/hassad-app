import { cn } from "@/lib/utils";

interface PortalProgressCardProps {
  title: string;
  value: number;
  max?: number;
  summary: string;
  caption?: string;
  className?: string;
}

export function PortalProgressCard({
  title,
  value,
  max = 100,
  summary,
  caption,
  className,
}: PortalProgressCardProps) {
  const safeMax = max <= 0 ? 100 : max;
  const percentage = Math.min(100, Math.max(0, Math.round((value / safeMax) * 100)));

  return (
    <div
      className={cn(
        "rounded-[30px] border-[1.5px] border-portal-card-border bg-natural-0 px-6 py-7",
        className,
      )}
    >
      <div className="flex items-center justify-between gap-4">
        <h2 className="text-[20px] font-semibold leading-9 text-natural-100 lg:text-[22px]">
          {title}
        </h2>
        <p className="text-[22px] font-semibold leading-none text-secondary-500 lg:text-[24px]">
          {percentage}%
        </p>
      </div>

      <div className="mt-6 h-4 overflow-hidden rounded-full bg-[#ECEEF2]">
        <div
          className="h-full rounded-full bg-gauge-fill transition-all"
          style={{ width: `${percentage}%` }}
        />
      </div>

      <div className="mt-5 flex flex-col gap-2 text-sm leading-6 text-portal-note-text lg:flex-row lg:items-center lg:justify-between">
        <p className="font-medium text-natural-100">{summary}</p>
        {caption ? <p>{caption}</p> : null}
      </div>
    </div>
  );
}