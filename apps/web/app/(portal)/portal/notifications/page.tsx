"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  AlertCircle,
  Bell,
  CheckCheck,
  CreditCard,
  ExternalLink,
  FileText,
  Layout,
  MessageSquare,
  Package,
  Receipt,
  TrendingUp,
} from "lucide-react";
import { toast } from "sonner"; // NEW
import { PortalEmptyState } from "@/components/portal/shared/PortalEmptyState";
import { PageIntro } from "@/components/design-system/PageIntro";
import { SurfaceCard } from "@/components/design-system/SurfaceCard";
import {
  FilterBar,
  type FilterGroup,
} from "@/components/design-system/FilterBar";
import {
  useGetMyNotificationsQuery,
  useMarkAsReadMutation,
  useMarkAllAsReadMutation,
  type PortalNotificationItem,
} from "@/features/portal-notifications/portalNotificationsApi";
import { formatRelativeTime } from "@/lib/format";
import { NotificationEventType } from "@hassad/shared";

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
    bg: "bg-action-purple-soft",
    color: "text-action-purple",
    icon: <FileText className="w-5 h-5" />,
  },
  contract: {
    bg: "bg-action-blue-soft",
    color: "text-action-blue",
    icon: <FileText className="w-5 h-5" />,
  },
  invoice: {
    bg: "bg-action-blue-soft",
    color: "text-action-blue",
    icon: <Receipt className="w-5 h-5" />,
  },
  INVOICE: {
    bg: "bg-action-blue-soft",
    color: "text-action-blue",
    icon: <Receipt className="w-5 h-5" />,
  },
  deliverable: {
    bg: "bg-action-purple-soft",
    color: "text-action-purple",
    icon: <Package className="w-5 h-5" />,
  },
  project: {
    bg: "bg-badge-gray-bg",
    color: "text-badge-gray-text",
    icon: <Layout className="w-5 h-5" />,
  },
  campaign: {
    bg: "bg-badge-green-bg",
    color: "text-badge-green-text",
    icon: <TrendingUp className="w-5 h-5" />,
  },
  conversation: {
    bg: "bg-action-cyan-soft",
    color: "text-action-cyan",
    icon: <MessageSquare className="w-5 h-5" />,
  },
  payment: {
    bg: "bg-badge-green-bg",
    color: "text-badge-green-text",
    icon: <CreditCard className="w-5 h-5" />,
  },
  PAYMENT: {
    bg: "bg-badge-green-bg",
    color: "text-badge-green-text",
    icon: <CreditCard className="w-5 h-5" />,
  },
  default: {
    bg: "bg-badge-gray-bg",
    color: "text-badge-gray-text",
    icon: <AlertCircle className="w-5 h-5" />,
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
    NotificationEventType.CONTRACT_SENT,
    NotificationEventType.INVOICE_SENT,
    NotificationEventType.INVOICE_CREATED,
    NotificationEventType.PROPOSAL_SENT,
    NotificationEventType.DELIVERABLE_APPROVAL,
    NotificationEventType.DELIVERABLE_READY,
    NotificationEventType.ACTION_REQUIRED,
  ];
  if (eventType && actionTypes.includes(eventType as NotificationEventType))
    return true;
  if (entityType === "proposal") {
    const actionEvents = [NotificationEventType.PROPOSAL_SENT];
    return eventType
      ? actionEvents.includes(eventType as NotificationEventType)
      : true;
  }
  if (entityType === "contract") {
    const actionEvents = ["CONTRACT_SENT"];
    return eventType
      ? actionEvents.includes(eventType as NotificationEventType)
      : true;
  }
  return false;
}

export default function PortalNotificationsPage() {
  const router = useRouter();
  const [activeFilters, setActiveFilters] = useState<Record<string, string[]>>(
    {},
  );
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const filter = (activeFilters["filter"]?.[0] ?? "all") as FilterTab;

  const handleFilterChange = useCallback(
    (groupKey: string, values: string[]) => {
      setActiveFilters((prev) => ({ ...prev, [groupKey]: values }));
    },
    [],
  );

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
      await markAsRead(id).unwrap();
    } catch (err) {
      toast.error(err?.data?.message || "فشل في وضع علامة مقروءة");
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
          <PortalEmptyState
            icon={Bell}
            title={
              filter === "action" ? "لا توجد إجراءات مطلوبة" : "لا توجد إشعارات"
            }
            description={
              filter === "all"
                ? "ستظهر هنا جميع الإشعارات المتعلقة بمشاريعك"
                : undefined
            }
          />
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
                        className={`flex items-center justify-center rounded-full shrink-0 ${entityConfig.bg} ${entityConfig.color}`}
                        style={{ width: 44, height: 44 }}
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
