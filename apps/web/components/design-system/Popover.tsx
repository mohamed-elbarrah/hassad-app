import type { ReactNode } from "react";
import {
  Popover as BasePopover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

interface PopoverProps {
  trigger: ReactNode;
  children: ReactNode;
  align?: "start" | "center" | "end";
  className?: string;
  contentClassName?: string;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function Popover({
  trigger,
  children,
  align = "end",
  className,
  contentClassName,
  open,
  onOpenChange,
}: PopoverProps) {
  return (
    <BasePopover open={open} onOpenChange={onOpenChange}>
      <PopoverTrigger asChild className={className}>
        {trigger}
      </PopoverTrigger>
      <PopoverContent
        align={align}
        className={cn(
          "rounded-2xl border-[1.5px] border-portal-card-border bg-natural-0 p-4 shadow-lg",
          contentClassName,
        )}
      >
        {children}
      </PopoverContent>
    </BasePopover>
  );
}
