"use client";

import { Skeleton } from "@/components/design-system/Skeleton";
import { cn } from "@/lib/utils";

interface TeamWorkloadProps {
  data?: {
    available?: number;
    busy?: number;
    overloaded?: number;
  };
  isLoading: boolean;
}

export function TeamWorkload({ data, isLoading }: TeamWorkloadProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 gap-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-16 rounded-2xl" />
        ))}
      </div>
    );
  }

  const items = [
    {
      label: "متاح",
      value: data?.available ?? 0,
      color: "bg-success-100 text-success-600 border-success-200",
    },
    {
      label: "مشغول",
      value: data?.busy ?? 0,
      color: "bg-alert-100 text-alert-600 border-alert-200",
    },
    {
      label: "محمل فوق الطاقة",
      value: data?.overloaded ?? 0,
      color: "bg-danger-100 text-danger-600 border-danger-200",
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-3">
      {items.map((item) => (
        <div
          key={item.label}
          className={cn(
            "rounded-2xl border p-4 flex items-center justify-between",
            item.color,
          )}
        >
          <span className="text-sm font-medium">{item.label}</span>
          <span className="text-xl font-bold">{item.value}</span>
        </div>
      ))}
    </div>
  );
}
