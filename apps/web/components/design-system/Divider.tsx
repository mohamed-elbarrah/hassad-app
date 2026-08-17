import { cn } from "@/lib/utils";

interface DividerProps {
  className?: string;
}

export function Divider({ className }: DividerProps) {
  return (
    <div className={cn("border-t-[1.5px] border-portal-divider", className)} />
  );
}
