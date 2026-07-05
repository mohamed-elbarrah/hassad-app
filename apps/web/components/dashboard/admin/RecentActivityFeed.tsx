"use client";

import {
  Activity,
  UserPlus,
  CheckCircle2,
  AlertTriangle,
  FileText,
  MessageSquare,
  FileSignature,
} from "lucide-react";
import { SurfaceCard } from "@/components/design-system/SurfaceCard";
import { Skeleton } from "@/components/design-system/Skeleton";
import { cn } from "@/lib/utils";

type ActivityEntry = {
  id: string;
  entityType: string;
  eventType: string;
  description: string;
  occurredAt: string;
  actorName: string | null;
};

const ENTITY_ICON: Record<string, any> = {
  client: UserPlus,
  task: CheckCircle2,
  contract: FileSignature,
  dispute: MessageSquare,
  request: FileText,
  default: Activity,
};

const ENTITY_COLOR: Record<string, string> = {
  client: "text-success-600",
  task: "text-action-blue",
  contract: "text-action-purple",
  dispute: "text-danger-500",
  request: "text-alert-600",
};

function timeAgo(dateStr: string): string {
  const now = Date.now();
  const date = new Date(dateStr).getTime();
  const diff = now - date;
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return "الآن";
  if (minutes < 60) return `منذ ${minutes} د`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `منذ ${hours} س`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `منذ ${days} ي`;
  return dateStr.slice(0, 10);
}

export function RecentActivityFeed({
  activities,
  isLoading,
}: {
  activities?: ActivityEntry[];
  isLoading: boolean;
}) {
  if (isLoading) {
    return (
      <SurfaceCard title="آخر النشاطات" icon={Activity}>
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-14 rounded-xl" />
          ))}
        </div>
      </SurfaceCard>
    );
  }

  if (!activities || activities.length === 0) {
    return (
      <SurfaceCard title="آخر النشاطات" icon={Activity}>
        <div className="flex flex-col items-center justify-center py-8 text-portal-note-text">
          <Activity className="size-8 mb-2 opacity-40" />
          <p className="text-sm">لا توجد نشاطات حديثة</p>
        </div>
      </SurfaceCard>
    );
  }

  return (
    <SurfaceCard title="آخر النشاطات" icon={Activity}>
      <div className="space-y-1">
        {activities.map((entry) => {
          const Icon = ENTITY_ICON[entry.entityType] ?? ENTITY_ICON.default;
          const color = ENTITY_COLOR[entry.entityType] ?? "text-portal-note-text";
          return (
            <div
              key={entry.id}
              className="flex items-start gap-3 rounded-xl px-3 py-2.5 hover:bg-badge-gray-bg/50 transition-colors"
            >
              <div className="w-8 h-8 rounded-full bg-badge-gray-bg flex items-center justify-center shrink-0 mt-0.5">
                <Icon className={cn("size-4", color)} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm text-natural-100 leading-snug">
                  {entry.description}
                </p>
                <div className="flex items-center gap-2 mt-0.5">
                  {entry.actorName && (
                    <span className="text-[11px] text-portal-note-text">
                      {entry.actorName}
                    </span>
                  )}
                  <span className="text-[11px] text-portal-note-text">
                    {timeAgo(entry.occurredAt)}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </SurfaceCard>
  );
}
