"use client";

import { StatCard } from "@/components/design-system/StatCard";
import { LucideIcon } from "lucide-react";

interface KPIStatCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  trend?: {
    value: string;
    isUp: boolean;
  };
  description?: string;
  className?: string;
}

export function KPIStatCard({
  title,
  value,
  icon,
  trend,
  description,
  className,
}: KPIStatCardProps) {
  return (
    <StatCard
      title={title}
      value={value}
      icon={icon}
      className={className}
      trend={
        trend
          ? trend.isUp
            ? "up"
            : "down"
          : description
            ? "neutral"
            : undefined
      }
      trendValue={trend ? trend.value : description}
    />
  );
}
