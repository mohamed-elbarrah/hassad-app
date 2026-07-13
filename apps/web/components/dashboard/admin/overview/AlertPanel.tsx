"use client";

import { AlertTriangle } from "lucide-react";
import { SurfaceCard } from "@/components/design-system/SurfaceCard";
import { Pill } from "@/components/design-system/Pill";
import { cn } from "@/lib/utils";

export interface AlertCategoryItem {
  id: string;
  title: string;
  subtitle?: string;
  href?: string;
}

export interface AlertCategory {
  key: string;
  label: string;
  count: number;
  severity: "HIGH" | "MEDIUM" | "LOW";
  href: string;
  items: AlertCategoryItem[];
}

interface AlertPanelProps {
  categories: AlertCategory[];
  className?: string;
}

const severityDotClass = {
  HIGH: "bg-danger-500",
  MEDIUM: "bg-alert-500",
  LOW: "bg-success-500",
};

export function AlertPanel({ categories, className }: AlertPanelProps) {
  const totalUrgent = categories.reduce((sum, c) => sum + c.count, 0);

  if (categories.length === 0) {
    return (
      <SurfaceCard title="ما يحتاج اهتماماً" icon={AlertTriangle} className={className}>
        <p className="text-sm text-portal-note-text text-center py-6">
          لا توجد عناصر تحتاج اهتماماً
        </p>
      </SurfaceCard>
    );
  }

  return (
    <SurfaceCard
      title="ما يحتاج اهتماماً"
      icon={AlertTriangle}
      action={
        totalUrgent > 0 && (
          <Pill tone="danger">{totalUrgent}</Pill>
        )
      }
      className={className}
    >
      <div className="space-y-4">
        {categories
          .filter((cat) => cat.count > 0)
          .map((cat) => (
            <div key={cat.key}>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2 min-w-0">
                  <span
                    className={cn(
                      "w-2 h-2 rounded-full shrink-0",
                      severityDotClass[cat.severity],
                    )}
                  />
                  <span className="text-sm font-medium text-natural-100 truncate">
                    {cat.label}
                  </span>
                  <Pill tone={cat.severity === "HIGH" ? "danger" : cat.severity === "MEDIUM" ? "warning" : "neutral"}>
                    {cat.count}
                  </Pill>
                </div>
                <a
                  href={cat.href}
                  className="text-xs text-secondary-500 hover:text-secondary-600 shrink-0"
                >
                  عرض الكل ←
                </a>
              </div>

              {cat.items.length > 0 && (
                <div className="space-y-1.5 mr-5">
                  {cat.items.slice(0, 3).map((item) => (
                    <div key={item.id} className="flex items-center justify-between">
                      <span className="text-xs text-portal-note-text truncate">
                        {item.title}
                      </span>
                      {item.subtitle && (
                        <span className="text-xs text-neutral-300 shrink-0 mr-2">
                          {item.subtitle}
                        </span>
                      )}
                    </div>
                  ))}
                  {cat.items.length > 3 && (
                    <p className="text-xs text-neutral-300 mr-2">
                      +{cat.items.length - 3} أخرى
                    </p>
                  )}
                </div>
              )}
            </div>
          ))}
      </div>
    </SurfaceCard>
  );
}
