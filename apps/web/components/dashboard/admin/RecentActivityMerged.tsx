"use client";

import {
  Activity,
  UserPlus,
  CheckCircle2,
  FileText,
  MessageSquare,
  FileSignature,
  AlertTriangle,
  Clock,
} from "lucide-react";
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

type AlertEntry = {
  count: number;
  label: string;
  link: string;
  items?: any[];
};

type AlertsData = {
  overdueTasks?: AlertEntry;
  agedInvoices?: AlertEntry;
  escalatedDisputes?: AlertEntry;
  failedWebhooks?: AlertEntry;
  expiringContracts?: AlertEntry;
  pendingRequests?: AlertEntry;
};

interface RecentActivityMergedProps {
  activities?: ActivityEntry[];
  alerts?: AlertsData;
  isLoading: boolean;
}

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

const ALERT_META: Record<
  string,
  { icon: any; color: string; bg: string }
> = {
  overdueTasks: {
    icon: Clock,
    color: "text-danger-600",
    bg: "bg-danger-100",
  },
  agedInvoices: {
    icon: FileText,
    color: "text-alert-600",
    bg: "bg-alert-100",
  },
  escalatedDisputes: {
    icon: MessageSquare,
    color: "text-danger-500",
    bg: "bg-danger-100",
  },
  pendingRequests: {
    icon: FileText,
    color: "text-action-blue",
    bg: "bg-action-blue-soft",
  },
  expiringContracts: {
    icon: FileSignature,
    color: "text-action-purple",
    bg: "bg-action-purple-soft",
  },
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

const ALERT_ORDER = [
  "overdueTasks",
  "escalatedDisputes",
  "agedInvoices",
  "pendingRequests",
  "expiringContracts",
];

export function RecentActivityMerged({
  activities,
  alerts,
  isLoading,
}: RecentActivityMergedProps) {
  if (isLoading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-14 rounded-xl" />
        ))}
        <Skeleton className="h-10 rounded-xl" />
      </div>
    );
  }

  const activityItems = Array.isArray(activities) ? activities : [];
  const alertChips = ALERT_ORDER
    .map((key) => ({ key, ...ALERT_META[key], data: alerts?.[key] }))
    .filter((c) => c.data?.count > 0);

  const hasContent = activityItems.length > 0 || alertChips.length > 0;

  if (!hasContent) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-portal-note-text">
        <Activity className="size-8 mb-2 opacity-40" />
        <p className="text-sm">لا توجد نشاطات حديثة</p>
      </div>
    );
  }

  return (
    <div className="space-y-1">
      {activityItems.slice(0, 4).map((entry) => {
        const Icon = ENTITY_ICON[entry.entityType] ?? ENTITY_ICON.default;
        const color =
          ENTITY_COLOR[entry.entityType] ?? "text-portal-note-text";
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

      {alertChips.length > 0 && (
        <>
          {activityItems.length > 0 && (
            <div className="border-t border-portal-divider my-2" />
          )}
          <div className="flex flex-wrap gap-2 pt-1">
            {alertChips.map((chip) => (
              <div
                key={chip.key}
                className={cn(
                  "inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium",
                  chip.bg,
                  chip.color,
                )}
              >
                <chip.icon className="size-3.5" />
                <span>{chip.data.label}</span>
                <span className="font-bold">{chip.data.count}</span>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
