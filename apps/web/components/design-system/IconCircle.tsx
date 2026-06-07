"use client";

import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface IconCircleProps {
  icon: LucideIcon;
  size?: "sm" | "md" | "lg";
  className?: string;
}

const sizeMap = {
  sm: { container: "h-9 w-9", icon: "h-4 w-4" },
  md: { container: "h-11 w-11", icon: "h-5 w-5" },
  lg: { container: "h-14 w-14", icon: "h-7 w-7" },
};

export function IconCircle({
  icon: Icon,
  size = "md",
  className,
}: IconCircleProps) {
  const s = sizeMap[size];
  return (
    <div
      className={cn(
        "flex shrink-0 items-center justify-center rounded-full border-[1.5px] border-portal-card-border bg-natural-0",
        s.container,
        className,
      )}
    >
      <Icon className={cn("text-portal-icon", s.icon)} />
    </div>
  );
}
