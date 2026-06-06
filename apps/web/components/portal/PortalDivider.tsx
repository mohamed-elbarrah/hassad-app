import { cn } from "@/lib/utils";

interface PortalDividerProps {
  className?: string;
}

export function PortalDivider({ className }: PortalDividerProps) {
  return (
    <div
      className={cn("border-t-[1.5px] border-portal-divider", className)}
    />
  );
}
