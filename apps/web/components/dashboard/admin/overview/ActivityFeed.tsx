"use client";

import { Activity } from "lucide-react";
import { SurfaceCard } from "@/components/design-system/SurfaceCard";
import { formatRelativeTime } from "@/lib/format";

export interface ActivityItem {
  id: string;
  actorName: string | null;
  action: string;
  entityType?: string;
  createdAt: string;
}

interface ActivityFeedProps {
  items: ActivityItem[];
  maxItems?: number;
  className?: string;
}

export function ActivityFeed({
  items,
  maxItems = 8,
  className,
}: ActivityFeedProps) {
  const displayItems = items.slice(0, maxItems);

  return (
    <SurfaceCard
      title="آخر النشاطات"
      icon={Activity}
      action={
        <a
          href="/dashboard/admin/audit"
          className="text-xs text-secondary-500 hover:text-secondary-600"
        >
          عرض كل النشاطات ←
        </a>
      }
      className={className}
    >
      {displayItems.length === 0 ? (
        <p className="text-sm text-portal-note-text text-center py-6">
          لا توجد نشاطات حديثة
        </p>
      ) : (
        <div className="space-y-3 max-h-80 overflow-y-auto">
          {displayItems.map((item) => (
            <div
              key={item.id}
              className="flex items-start gap-3 p-3 rounded-xl border border-portal-card-border"
            >
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-badge-gray-bg">
                <Activity className="h-4 w-4 text-secondary-500" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-natural-100 truncate">
                  {item.actorName ?? "النظام"}
                </p>
                <p className="text-xs text-portal-note-text truncate">
                  {item.action}
                </p>
              </div>
              <span className="text-xs text-neutral-300 shrink-0">
                {formatRelativeTime(item.createdAt)}
              </span>
            </div>
          ))}
        </div>
      )}
    </SurfaceCard>
  );
}
