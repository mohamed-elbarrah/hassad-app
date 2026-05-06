"use client";

import type React from "react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Bell, BellOff, CheckCheck, ExternalLink } from "lucide-react";
import { useGetMyNotificationsQuery, useMarkAsReadMutation, useMarkAllAsReadMutation, type PortalNotificationItem } from "@/features/portal-notifications/portalNotificationsApi";
import { formatRelativeTime } from "@/lib/format";

type FilterTab = "all" | "action" | "info";

const ENTITY_ICON_MAP: Record<string, { bg: string; color: string; icon: React.ReactElement }> = {
  proposal: {
    bg: "rgba(122, 19, 232, 0.12)",
    color: "#7A13E8",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
        <polyline points="14 2 14 8 20 8" />
      </svg>
    ),
  },
  contract: {
    bg: "rgba(38, 132, 252, 0.12)",
    color: "#2684FC",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
        <rect x="8" y="2" width="8" height="4" rx="1" ry="1" />
      </svg>
    ),
  },
  invoice: {
    bg: "rgba(38, 132, 252, 0.12)",
    color: "#2684FC",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="5" width="20" height="14" rx="2" />
        <line x1="2" y1="10" x2="22" y2="10" />
      </svg>
    ),
  },
  INVOICE: {
    bg: "rgba(38, 132, 252, 0.12)",
    color: "#2684FC",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="5" width="20" height="14" rx="2" />
        <line x1="2" y1="10" x2="22" y2="10" />
      </svg>
    ),
  },
  deliverable: {
    bg: "rgba(122, 19, 232, 0.12)",
    color: "#7A13E8",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="20 6 9 17 4 12" />
      </svg>
    ),
  },
  project: {
    bg: "rgba(18, 25, 54, 0.08)",
    color: "#121936",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
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
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
        <polyline points="17 6 23 6 23 12" />
      </svg>
    ),
  },
  conversation: {
    bg: "rgba(0, 174, 255, 0.12)",
    color: "#00AEFF",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
      </svg>
    ),
  },
  payment: {
    bg: "rgba(14, 213, 137, 0.12)",
    color: "#0ED589",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
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
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
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
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
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

function resolvePortalUrl(entityType: string | null | undefined, entityId: string | null | undefined): string | null {
  if (!entityType || !entityId) return null;
  if (entityType === "proposal") return `/portal/proposals/${entityId}`;
  if (entityType === "contract") return `/portal/contracts/${entityId}`;
  if (entityType === "deliverable") return `/portal/deliverables/${entityId}`;
  if (entityType === "project") return `/portal/projects`;
  if (entityType === "campaign") return `/portal/campaigns/${entityId}`;
  if (entityType === "invoice" || entityType === "INVOICE") return `/portal/finance`;
  if (entityType === "conversation") return `/portal/projects`;
  if (entityType === "payment" || entityType === "PAYMENT") return `/portal/finance`;
  return null;
}

function getPrimaryActionLabel(entityType: string | null | undefined): string {
  if (entityType === "proposal") return "مراجعة العرض";
  if (entityType === "contract") return "مراجعة العقد";
  if (entityType === "deliverable") return "مراجعة التسليمة";
  if (entityType === "invoice" || entityType === "INVOICE") return "دفع الفاتورة";
  if (entityType === "payment" || entityType === "PAYMENT") return "عرض الفاتورة";
  if (entityType === "project") return "متابعة المشروع";
  if (entityType === "campaign") return "عرض الحملة";
  return "عرض التفاصيل";
}

function getActionColor(entityType: string | null | undefined): { bg: string; text: string } {
  if (entityType === "invoice" || entityType === "INVOICE") return { bg: "rgba(38, 132, 252, 0.12)", text: "#2684FC" };
  return { bg: "rgba(122, 19, 232, 0.12)", text: "#7A13E8" };
}

function isActionRequired(entityType: string | null | undefined, eventType: string | null | undefined): boolean {
  const actionTypes = ["CONTRACT_SENT", "INVOICE_SENT", "INVOICE_CREATED", "PROPOSAL_SENT", "DELIVERABLE_APPROVAL", "DELIVERABLE_READY", "ACTION_REQUIRED"];
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
  const [filter, setFilter] = useState<FilterTab>("all");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const isReadFilter = filter === "action" ? false : filter === "info" ? true : undefined;

  const { data, isLoading } = useGetMyNotificationsQuery({ page: 1, limit: 50, isRead: isReadFilter });

  const [markAsRead] = useMarkAsReadMutation();
  const [markAllAsRead] = useMarkAllAsReadMutation();

  const notifications = (data as unknown as { data?: PortalNotificationItem[]; unreadCount?: number })?.data ?? [];
  const unreadCount = (data as unknown as { unreadCount?: number })?.unreadCount ?? 0;

  const filteredNotifications = notifications.filter((n: PortalNotificationItem) => {
    if (filter === "all") return true;
    if (filter === "action") return n.eventType ? isActionRequired(n.entityType, n.eventType) : isActionRequired(n.entityType, null);
    if (filter === "info") return !(n.eventType ? isActionRequired(n.entityType, n.eventType) : isActionRequired(n.entityType, null));
    return true;
  });

  async function handleMarkRead(id: string) {
    try {
      await markAsRead(id);
    } catch {
      // ignore
    }
  }

  async function handleNavigate(n: PortalNotificationItem) {
    if (!n.isRead) {
      await handleMarkRead(n.id);
    }
    const url = resolvePortalUrl(n.entityType, n.entityId);
    if (url) {
      router.push(url);
    }
  }

  return (
    <div className="w-full mx-auto" dir="rtl">
      <div
        className="rounded-[30px] border bg-white"
        style={{
          borderColor: "#E1E4EA",
          borderWidth: "1.5px",
        }}
      >
        <div className="flex items-center justify-between p-5 border-b" style={{ borderColor: "#ECEEF2", borderWidth: "1.5px" }}>
          <div className="flex items-center gap-3">
            <div
              className="flex items-center justify-center rounded-full"
              style={{
                width: 48,
                height: 48,
                backgroundColor: "rgba(18, 25, 54, 0.08)",
              }}
            >
              <Bell style={{ width: 22, height: 22, color: "#121936" }} />
            </div>
            <div className="text-right">
              <h2
                style={{
                  fontSize: 24,
                  fontWeight: 600,
                  lineHeight: "36px",
                  color: "#000000",
                }}
              >
                الإشعارات
              </h2>
              {unreadCount > 0 && (
                <p
                  style={{
                    fontSize: 14,
                    lineHeight: "21px",
                    color: "rgba(0, 0, 0, 0.6)",
                  }}
                >
                  {unreadCount} إشعار غير مقروء
                </p>
              )}
            </div>
          </div>

          {unreadCount > 0 && (
            <button
              className="flex items-center gap-1 px-4 py-2 rounded-xl hover:bg-gray-100 transition-colors border-0 bg-transparent cursor-pointer"
              style={{
                fontSize: 16,
                fontWeight: 500,
                color: "#525866",
                lineHeight: "24px",
                border: "1.5px solid #E1E4EA",
              }}
              onClick={() => markAllAsRead()}
            >
              <CheckCheck style={{ width: 18, height: 18 }} />
              تعليم الكل كمقروء
            </button>
          )}
        </div>

        <div className="px-5 py-4 border-b" style={{ borderColor: "#ECEEF2", borderWidth: "1.5px" }}>
          <div className="flex gap-2">
            {([
              { key: "all" as FilterTab, label: "الكل" },
              { key: "action" as FilterTab, label: "إجراءات مطلوبة" },
              { key: "info" as FilterTab, label: "معلومات عامة" },
            ]).map((tab) => (
              <button
                key={tab.key}
                className="px-4 py-2 rounded-xl transition-colors border-0 cursor-pointer"
                style={{
                  backgroundColor: filter === tab.key ? "#121936" : "transparent",
                  color: filter === tab.key ? "#FFFFFF" : "#525866",
                  fontSize: 15,
                  fontWeight: 500,
                  lineHeight: "22px",
                  border: filter === tab.key ? "none" : "1.5px solid #E1E4EA",
                }}
                onClick={() => setFilter(tab.key)}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        <div className="divide-y" style={{ borderColor: "#ECEEF2", borderWidth: "0" }}>
          {isLoading ? (
            <div className="p-8 space-y-4">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="animate-pulse flex items-start gap-4">
                  <div className="w-12 h-12 rounded-full bg-gray-200 shrink-0" />
                  <div className="flex-1 space-y-2">
                    <div className="h-5 bg-gray-200 rounded w-2/3" />
                    <div className="h-4 bg-gray-100 rounded w-full" />
                    <div className="h-3 bg-gray-100 rounded w-1/4" />
                  </div>
                </div>
              ))}
            </div>
          ) : filteredNotifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16" style={{ color: "#A8ABB2" }}>
              <BellOff style={{ width: 56, height: 56, marginBottom: 16 }} />
              <p style={{ fontSize: 20, fontWeight: 500, lineHeight: "30px" }}>
                {filter === "action" ? "لا توجد إجراءات مطلوبة" : filter === "info" ? "لا توجد إشعارات" : "لا توجد إشعارات"}
              </p>
              <p style={{ fontSize: 16, lineHeight: "24px", marginTop: 4, color: "rgba(0, 0, 0, 0.5)" }}>
                {filter === "all" ? "ستظهر هنا جميع الإشعارات المتعلقة بمشاريعك" : ""}
              </p>
            </div>
          ) : (
            filteredNotifications.map((n) => {
              const entityConfig = getEntityConfig(n.entityType);
              const isAction = n.eventType ? isActionRequired(n.entityType, n.eventType) : isActionRequired(n.entityType, null);
              const isExpanded = expandedId === n.id;
              const actionColor = getActionColor(n.entityType);

              return (
                <div
                  key={n.id}
                  className="transition-colors"
                  style={{
                    backgroundColor: !n.isRead ? "rgba(18, 25, 54, 0.03)" : undefined,
                  }}
                >
                  <button
                    className="w-full text-right p-5 hover:bg-gray-50 transition-colors border-0 bg-transparent cursor-pointer"
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
                            className="text-right"
                            style={{
                              fontSize: 18,
                              fontWeight: n.isRead ? 400 : 600,
                              lineHeight: "27px",
                              color: "#000000",
                            }}
                          >
                            {n.title}
                          </p>
                          <div className="flex items-center gap-2 shrink-0">
                            {isAction && (
                              <span
                                className="px-2.5 py-0.5 rounded-lg text-xs font-medium"
                                style={{
                                  backgroundColor: actionColor.bg,
                                  color: actionColor.text,
                                  fontSize: 12,
                                  lineHeight: "18px",
                                }}
                              >
                                مطلوب إجراء
                              </span>
                            )}
                            {!n.isRead && (
                              <span
                                className="h-2.5 w-2.5 rounded-full shrink-0"
                                style={{ backgroundColor: "#121936" }}
                              />
                            )}
                          </div>
                        </div>

                        <p
                          className="text-right mt-1"
                          style={{
                            fontSize: 16,
                            lineHeight: "24px",
                            color: "rgba(0, 0, 0, 0.6)",
                          }}
                        >
                          {isExpanded ? n.body : n.body.length > 120 ? n.body.substring(0, 117) + "..." : n.body}
                        </p>

                        <div className="flex items-center justify-between mt-2 pt-1">
                          <p
                            className="text-xs"
                            style={{
                              color: "#A8ABB2",
                              lineHeight: "18px",
                            }}
                          >
                            {formatRelativeTime(n.createdAt)}
                          </p>

                          {isAction && (
                            <span
                              className="flex items-center gap-1 px-3 py-1 rounded-lg text-xs font-medium cursor-pointer hover:underline"
                              style={{
                                backgroundColor: actionColor.bg,
                                color: actionColor.text,
                                fontSize: 14,
                                lineHeight: "21px",
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
            })
          )}
        </div>
      </div>
    </div>
  );
}
