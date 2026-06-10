import { Pill, type PillTone } from "@/components/design-system/Pill";
import { cn } from "@/lib/utils";

interface MetricCardProps {
  title: string;
  value: string | number;
  pillText?: string;
  pillTone?: PillTone;
  className?: string;
}

export function MetricCard({
  title,
  value,
  pillText,
  pillTone = "neutral",
  className,
}: MetricCardProps) {
  return (
    <div
      className={cn(
        "rounded-[30px] border-[1.5px] border-portal-card-border bg-natural-0 px-6 py-7 text-right",
        className,
      )}
    >
      <p className="text-[18px] font-medium leading-8 text-portal-icon">
        {title}
      </p>

      <div className="mt-5 flex items-end justify-between gap-4">
        <p className="text-[48px] font-semibold leading-none text-natural-100 lg:text-[54px]">
          {value}
        </p>

        {pillText ? <Pill tone={pillTone}>{pillText}</Pill> : <span />}
      </div>
    </div>
  );
}
