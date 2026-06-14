"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Bell, BellOff, CheckCheck, ExternalLink } from "lucide-react";
import { PageIntro } from "@/components/design-system/PageIntro";
import { SurfaceCard } from "@/components/design-system/SurfaceCard";
import { FilterBar, type FilterGroup } from "@/components/design-system/FilterBar";
import {
  useGetMyNotificationsQuery,
  useMarkAsReadMutation,
  useMarkAllAsReadMutation,
  type PortalNotificationItem,
} from "@/features/portal-notifications/portalNotificationsApi";
import { formatRelativeTime } from "@/lib/format";

const FILTER_GROUPS: FilterGroup[] = [
  {
    key: "filter",
    label: "نوع الإشعار",
    options: [
      { label: "الكل", value: "all" },
      { label: "إجراءات مطلوبة", value: "action" },
      { label: "معلومات عامة", value: "info" },
    ],
  },
];

type FilterTab = "all" | "action" | "info";

const ENTITY_ICON_MAP: Record<
  string,
  { bg: string; color: string; icon: React.ReactNode }
> = {
  proposal: {
    bg: "rgba(122, 19, 232, 0.12)",
    color: "#7A13E8",
    icon: (
      <svg
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
        <polyline points="14 2 14 8 20 8" />
      </svg>
    ),
  },
  contract: {
    bg: "rgba(38, 132, 252, 0.12)",
    color: "#2684FC",
    icon: (
      <svg
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
        <rect x="8" y="2" width="8" height="4" rx="1" ry="1" />
      </svg>
    ),
  },
  invoice: {
    bg: "rgba(38, 132, 252, 0.12)",
    color: "#2684FC",
    icon: (
      <svg
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <rect x="2" y="5" width="20" height="14" rx="2" />
        <line x1="2" y1="10" x2="22" y2="10" />
      </svg>
    ),
  },
  INVOICE: {
    bg: "rgba(38, 132, 252, 0.12)",
    color: "#2684FC",
    icon: (
      <svg
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <rect x="2" y="5" width="20" height="14" rx="2" />
        <line x1="2" y1="10" x2="22" y2="10" />
      </svg>
    ),
  },
  deliverable: {
    bg: "rgba(122, 19, 232, 0.12)",
    color: "#7A13E8",
    icon: (
      <svg
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <polyline points="20 6 9 17 4 12" />
      </svg>
    ),
  },
  project: {
    bg: "rgba(18, 25, 54, 0.08)",
    color: "#121936",
    icon: (
      <svg
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <rect x="3" y="3" width="18" height="18" rx="2" />
        <line x1="3" y1="9" x2="21" y2="9" />
        <line x1="9" y1="21" x2="9" y2="9" />
      </svg>
    ),
  },
  campaign: {
    bg: "rgba(14, 213, 137, 0.12)",
    color: "#0ED589",
    icon: (
      <svg
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
        <polyline points="17 6 23 6 23 12" />
      </svg>
    ),
  },
  conversation: {
    bg: "rgba(0, 174, 255, 0.12)",
    color: "#00AEFF",
    icon: (
      <svg
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
      </svg>
    ),
  },
  payment: {
    bg: "rgba(14, 213, 137, 0.12)",
    color: "#0ED589",
    icon: (
      <svg
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <circle cx="12" cy="12" r="10" />
        <line x1="12" y1="8" x2="12" y2="16" />
        <line x1="8" y1="12" x2="16" y2="12" />
      </svg>
    ),
  },
  PAYMENT: {
    bg: "rgba(14, 213, 137, 0.12)",
    color: "#0ED589",
    icon: (
      <svg
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <circle cx="12" cy="12" r="10" />
        <line x1="12" y1="8" x2="12" y2="16" />
        <line x1="8" y1="12" x2="16" y2="12" />
      </svg>
    ),
  },
  default: {
    bg: "rgba(18, 25, 54, 0.08)",
    color: "#121936",
    icon: (
      <svg
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <circle cx="12" cy="12" r="10" />
        <line x1="12" y1="16" x2="12" y2="12" />
        <line x1="12" y1="8" x2="12.01" y2="8" />
      </svg>
    ),
  },
};

function getEntityConfig(entityType: string | null | undefined) {
  if (!entityType) return ENTITY_ICON_MAP.default;
  return ENTITY_ICON_MAP[entityType] ?? ENTITY_ICON_MAP.default;
}

function resolvePortalUrl(
  entityType: string | null | undefined,
  entityId: string | null | undefined,
): string | null {
  if (!entityType || !entityId) return null;
  if (entityType === "proposal") return `/portal/proposals/${entityId}`;
  if (entityType === "contract") return `/portal/contracts/${entityId}`;
  if (entityType === "deliverable") return `/portal/deliverables/${entityId}`;
  if (entityType === "project") return `/portal/projects`;
  if (entityType === "campaign") return `/portal/campaigns/${entityId}`;
  if (entityType === "invoice" || entityType === "INVOICE")
    return `/portal/finance`;
  if (entityType === "conversation") return `/portal/projects`;
  if (entityType === "payment" || entityType === "PAYMENT")
    return `/portal/finance`;
  return null;
}

function getPrimaryActionLabel(entityType: string | null | undefined): string {
  if (entityType === "proposal") return "مراجعة العرض";
  if (entityType === "contract") return "مراجعة العقد";
  if (entityType === "deliverable") return "مراجعة التسليمة";
  if (entityType === "invoice" || entityType === "INVOICE")
    return "دفع الفاتورة";
  if (entityType === "payment" || entityType === "PAYMENT")
    return "عرض الفاتورة";
  if (entityType === "project") return "متابعة المشروع";
  if (entityType === "campaign") return "عرض الحملة";
  return "عرض التفاصيل";
}

function getActionColor(entityType: string | null | undefined): {
  bg: string;
  text: string;
} {
  if (entityType === "invoice" || entityType === "INVOICE")
    return { bg: "rgba(38, 132, 252, 0.12)", text: "#2684FC" };
  return { bg: "rgba(122, 19, 232, 0.12)", text: "#7A13E8" };
}

function isActionRequired(
  entityType: string | null | undefined,
  eventType: string | null | undefined,
): boolean {
  const actionTypes = [
    "CONTRACT_SENT",
    "INVOICE_SENT",
    "INVOICE_CREATED",
    "PROPOSAL_SENT",
    "DELIVERABLE_APPROVAL",
    "DELIVERABLE_READY",
    "ACTION_REQUIRED",
  ];
  if (eventType && actionTypes.includes(eventType)) return true;
  if (entityType === "proposal") {
    const actionEvents = ["PROPOSAL_SENT"];
    return eventType ? actionEvents.includes(eventType) : true;
  }
  if (entityType === "contract") {
    const actionEvents = ["CONTRACT_SENT"];
    return eventType ? actionEvents.includes(eventType) : true;
  }
  return false;
}

export default function PortalNotificationsPage() {
  const router = useRouter();
  const [activeFilters, setActiveFilters] = useState<Record<string, string[]>>({});
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const filter = (activeFilters["filter"]?.[0] ?? "all") as FilterTab;

  const handleFilterChange = useCallback((groupKey: string, values: string[]) => {
    setActiveFilters((prev) => ({ ...prev, [groupKey]: values }));
  }, []);

  const isReadFilter =
    filter === "action" ? false : filter === "info" ? true : undefined;

  const { data, isLoading } = useGetMyNotificationsQuery({
    page: 1,
    limit: 50,
    isRead: isReadFilter,
  });

  const [markAsRead] = useMarkAsReadMutation();
  const [markAllAsRead] = useMarkAllAsReadMutation();

  const notifications =
    (
      data as unknown as {
        data?: PortalNotificationItem[];
        unreadCount?: number;
      }
    )?.data ?? [];
  const unreadCount =
    (data as unknown as { unreadCount?: number })?.unreadCount ?? 0;

  const filteredNotifications = notifications.filter(
    (n: PortalNotificationItem) => {
      if (filter === "all") return true;
      if (filter === "action")
        return n.eventType
          ? isActionRequired(n.entityType, n.eventType)
          : isActionRequired(n.entityType, null);
      if (filter === "info")
        return !(n.eventType
          ? isActionRequired(n.entityType, n.eventType)
          : isActionRequired(n.entityType, null));
      return true;
    },
  );

  async function handleMarkRead(id: string) {
    try {
      await markAsRead(id);
    } catch {
      /* ignore */
    }
  }

  async function handleNavigate(n: PortalNotificationItem) {
    if (!n.isRead) await handleMarkRead(n.id);
    const url = resolvePortalUrl(n.entityType, n.entityId);
    if (url) router.push(url);
  }

  const actions = (
    <div className="flex items-center gap-3">
      {unreadCount > 0 && (
        <button
          type="button"
          className="flex items-center gap-1.5 h-12 rounded-2xl border-[1.5px] border-portal-card-border bg-natural-0 px-5 text-base font-medium text-portal-icon transition-colors hover:bg-badge-gray-bg"
          onClick={() => markAllAsRead()}
        >
          <CheckCheck style={{ width: 18, height: 18 }} />
          تعليم الكل كمقروء
        </button>
      )}
    </div>
  );

  return (
    <div className="flex flex-col gap-5" dir="rtl">
      <PageIntro
        title="الإشعارات"
        description="جميع الإشعارات الواردة، الإجراءات المطلوبة منك، والمعلومات العامة حول مشاريعك."
        icon={Bell}
        actions={actions}
      />

      <SurfaceCard
        title="صندوق الوارد"
        description={
          unreadCount > 0
            ? `${unreadCount} إشعار غير مقروء`
            : "لا يوجد إشعارات غير مقروءة"
        }
        icon={Bell}
        action={
          <FilterBar
            groups={FILTER_GROUPS}
            activeFilters={activeFilters}
            onFilterChange={handleFilterChange}
          />
        }
      >
        {isLoading ? (
          <div className="p-8 space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="animate-pulse flex items-start gap-4">
                <div className="w-12 h-12 rounded-full bg-portal-divider shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="h-5 bg-portal-divider rounded w-2/3" />
                  <div className="h-4 bg-portal-bg rounded w-full" />
                  <div className="h-3 bg-portal-bg rounded w-1/4" />
                </div>
              </div>
            ))}
          </div>
        ) : filteredNotifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 gap-4 text-portal-note-text">
            <BellOff className="h-14 w-14 text-portal-icon" />
            <p className="text-xl font-medium text-natural-100">
              {filter === "action"
                ? "لا توجد إجراءات مطلوبة"
                : filter === "info"
                  ? "لا توجد إشعارات"
                  : "لا توجد إشعارات"}
            </p>
            <p className="text-base text-portal-note-text">
              {filter === "all"
                ? "ستظهر هنا جميع الإشعارات المتعلقة بمشاريعك"
                : ""}
            </p>
          </div>
        ) : (
          <div className="divide-y-[1.5px] border-portal-divider">
            {filteredNotifications.map((n) => {
              const entityConfig = getEntityConfig(n.entityType);
              const isAction = n.eventType
                ? isActionRequired(n.entityType, n.eventType)
                : isActionRequired(n.entityType, null);
              const isExpanded = expandedId === n.id;
              const actionColor = getActionColor(n.entityType);

              return (
                <div
                  key={n.id}
                  className="transition-colors"
                  style={{
                    backgroundColor: !n.isRead
                      ? "rgba(18, 25, 54, 0.03)"
                      : undefined,
                  }}
                >
                  <button
                    className="w-full text-right p-5 hover:bg-badge-gray-bg/30 transition-colors border-0 bg-transparent cursor-pointer"
                    onClick={async () => {
                      if (!n.isRead) await handleMarkRead(n.id);
                      setExpandedId(isExpanded ? null : n.id);
                    }}
                  >
                    <div className="flex items-start gap-4">
                      <div
                        className="flex items-center justify-center rounded-full shrink-0"
                        style={{
                          width: 44,
                          height: 44,
                          backgroundColor: entityConfig.bg,
                          color: entityConfig.color,
                        }}
                      >
                        {entityConfig.icon}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-3">
                          <p
                            className="text-right font-medium text-base text-natural-100"
                            style={{
                              fontWeight: n.isRead ? 400 : 600,
                            }}
                          >
                            {n.title}
                          </p>
                          <div className="flex items-center gap-2 shrink-0">
                            {isAction && (
                              <span
                                className="px-2.5 py-0.5 rounded-2xl text-xs font-medium"
                                style={{
                                  backgroundColor: actionColor.bg,
                                  color: actionColor.text,
                                }}
                              >
                                مطلوب إجراء
                              </span>
                            )}
                            {!n.isRead && (
                              <span className="h-2.5 w-2.5 rounded-full bg-secondary-500" />
                            )}
                          </div>
                        </div>

                        <p className="text-right mt-1 text-sm leading-6 text-portal-note-text">
                          {isExpanded
                            ? n.body
                            : n.body.length > 120
                              ? n.body.substring(0, 117) + "..."
                              : n.body}
                        </p>

                        <div className="flex items-center justify-between mt-2 pt-1">
                          <p className="text-xs text-portal-note-text">
                            {formatRelativeTime(n.createdAt)}
                          </p>

                          {isAction && (
                            <span
                              className="flex items-center gap-1 px-3 py-1 rounded-2xl text-xs font-medium cursor-pointer hover:underline"
                              style={{
                                backgroundColor: actionColor.bg,
                                color: actionColor.text,
                              }}
                              onClick={(e) => {
                                e.stopPropagation();
                                handleNavigate(n);
                              }}
                            >
                              <ExternalLink style={{ width: 14, height: 14 }} />
                              {getPrimaryActionLabel(n.entityType)}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </SurfaceCard>
    </div>
  );
}
