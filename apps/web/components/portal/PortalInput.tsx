import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

interface PortalInputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "size"> {
  icon?: ReactNode;
  wrapperClassName?: string;
}

export function PortalInput({
  icon,
  wrapperClassName,
  className,
  ...props
}: PortalInputProps) {
  return (
    <div
      className={cn(
        "flex items-center gap-2 rounded-2xl border-[1.5px] border-portal-card-border bg-natural-0 px-3 py-2",
        wrapperClassName,
      )}
    >
      {icon && <span className="shrink-0 text-portal-icon">{icon}</span>}
      <input
        className={cn(
          "flex-1 bg-transparent text-sm outline-none text-right text-natural-100 placeholder:text-neutral-300",
          className,
        )}
        {...props}
      />
    </div>
  );
}
