import { cn } from "@/lib/utils";

export interface FilterOption {
  label: string;
  value: string;
}

interface FilterPillsProps {
  options: FilterOption[];
  active: string;
  onChange: (value: string) => void;
  className?: string;
}

export function FilterPills({
  options,
  active,
  onChange,
  className,
}: FilterPillsProps) {
  return (
    <div
      className={cn("flex flex-wrap items-center justify-end gap-2", className)}
    >
      {options.map((opt) => {
        const isActive = active === opt.value;

        return (
          <button
            key={opt.value}
            type="button"
            className={cn(
              "h-12 rounded-2xl border-[1.5px] px-5 text-base font-medium shadow-none transition-colors cursor-pointer",
              isActive
                ? "border-secondary-500 bg-secondary-500 text-white hover:bg-secondary-600 hover:text-white"
                : "border-portal-card-border bg-natural-0 text-portal-icon hover:bg-badge-gray-bg hover:text-secondary-500",
            )}
            onClick={() => onChange(opt.value)}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}
