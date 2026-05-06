import { PortalPill, type PortalPillTone } from "@/components/portal/PortalPill";
import { cn } from "@/lib/utils";

interface PortalMetricCardProps {
  title: string;
  value: string | number;
  pillText?: string;
  pillTone?: PortalPillTone;
  className?: string;
}

export function PortalMetricCard({
  title,
  value,
  pillText,
  pillTone = "neutral",
  className,
}: PortalMetricCardProps) {
  return (
    <div
      className={cn(
        "rounded-[30px] border-[1.5px] border-portal-card-border bg-natural-0 px-6 py-7 text-right",
        className,
      )}
    >
      <p className="text-[18px] font-medium leading-8 text-portal-icon">{title}</p>

      <div className="mt-5 flex items-end justify-between gap-4">
        <p className="text-[48px] font-semibold leading-none text-natural-100 lg:text-[54px]">
          {value}
        </p>

        {pillText ? <PortalPill tone={pillTone}>{pillText}</PortalPill> : <span />}
      </div>
    </div>
  );
}