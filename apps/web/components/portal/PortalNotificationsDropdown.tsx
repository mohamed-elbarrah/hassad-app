"use client";

import type React from "react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCheck, BellOff, ExternalLink } from "lucide-react";
import { useAppDispatch, useAppSelector } from "@/lib/hooks";
import { setDropdownOpen } from "@/features/notifications/notificationsSlice";
import {
  useGetMyNotificationsQuery,
  useMarkAsReadMutation,
  useMarkAllAsReadMutation,
  type PortalNotificationItem,
} from "@/features/portal-notifications/portalNotificationsApi";
import { formatRelativeTime } from "@/lib/format";
import Link from "next/link";

const ENTITY_ICONS: Record<string, React.ReactElement> = {
  proposal: (
    <div
      className="flex items-center justify-center rounded-full shrink-0"
      style={{
        width: 40,
        height: 40,
        background: "rgba(122, 19, 232, 0.12)",
        color: "#7A13E8",
      }}
    >
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
        <polyline points="14 2 14 8 20 8" />
      </svg>
    </div>
  ),
  contract: (
    <div
      className="flex items-center justify-center rounded-full shrink-0"
      style={{
        width: 40,
        height: 40,
        background: "rgba(38, 132, 252, 0.12)",
        color: "#2684FC",
      }}
    >
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
        <rect x="8" y="2" width="8" height="4" rx="1" ry="1" />
      </svg>
    </div>
  ),
  invoice: (
    <div
      className="flex items-center justify-center rounded-full shrink-0"
      style={{
        width: 40,
        height: 40,
        background: "rgba(38, 132, 252, 0.12)",
        color: "#2684FC",
      }}
    >
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="5" width="20" height="14" rx="2" />
        <line x1="2" y1="10" x2="22" y2="10" />
      </svg>
    </div>
  ),
  deliverable: (
    <div
      className="flex items-center justify-center rounded-full shrink-0"
      style={{
        width: 40,
        height: 40,
        background: "rgba(122, 19, 232, 0.12)",
        color: "#7A13E8",
      }}
    >
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="20 6 9 17 4 12" />
      </svg>
    </div>
  ),
  project: (
    <div
      className="flex items-center justify-center rounded-full shrink-0"
      style={{
        width: 40,
        height: 40,
        background: "rgba(18, 25, 54, 0.08)",
        color: "#121936",
      }}
    >
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="18" height="18" rx="2" />
        <line x1="3" y1="9" x2="21" y2="9" />
        <line x1="9" y1="21" x2="9" y2="9" />
      </svg>
    </div>
  ),
  campaign: (
    <div
      className="flex items-center justify-center rounded-full shrink-0"
      style={{
        width: 40,
        height: 40,
        background: "rgba(14, 213, 137, 0.12)",
        color: "#0ED589",
      }}
    >
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
        <polyline points="17 6 23 6 23 12" />
      </svg>
    </div>
  ),
  conversation: (
    <div
      className="flex items-center justify-center rounded-full shrink-0"
      style={{
        width: 40,
        height: 40,
        background: "rgba(0, 174, 255, 0.12)",
        color: "#00AEFF",
      }}
    >
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
      </svg>
    </div>
  ),
  payment: (
    <div
      className="flex items-center justify-center rounded-full shrink-0"
      style={{
        width: 40,
        height: 40,
        background: "rgba(14, 213, 137, 0.12)",
        color: "#0ED589",
      }}
    >
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" />
        <line x1="12" y1="8" x2="12" y2="16" />
        <line x1="8" y1="12" x2="16" y2="12" />
      </svg>
    </div>
  ),
  default: (
    <div
      className="flex items-center justify-center rounded-full shrink-0"
      style={{
        width: 40,
        height: 40,
        background: "rgba(18, 25, 54, 0.08)",
        color: "#121936",
      }}
    >
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" />
        <line x1="12" y1="16" x2="12" y2="12" />
        <line x1="12" y1="8" x2="12.01" y2="8" />
      </svg>
    </div>
  ),
};

function getEntityIcon(entityType: string | null | undefined) {
  if (!entityType) return ENTITY_ICONS.default;
  return ENTITY_ICONS[entityType] ?? ENTITY_ICONS.default;
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
  if (entityType === "project") return "متابعة المشروع";
  if (entityType === "campaign") return "عرض الحملة";
  return "عرض التفاصيل";
}

function NotificationListItem({
  notification,
  onSelect,
}: {
  notification: PortalNotificationItem;
  onSelect: (n: PortalNotificationItem) => void;
}) {
  return (
    <button
      className="w-full text-right px-4 py-3 hover:bg-gray-50 transition-colors border-b border-portal-divider last:border-0"
      style={{
        backgroundColor: !notification.isRead ? "rgba(18, 25, 54, 0.03)" : undefined,
      }}
      onClick={() => onSelect(notification)}
    >
      <div className="flex items-start gap-3">
        {getEntityIcon(notification.entityType)}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <p
              className="text-[14px] truncate text-right"
              style={{
                fontWeight: notification.isRead ? 400 : 600,
                color: "#000000",
                lineHeight: "21px",
              }}
            >
              {notification.title}
            </p>
            {!notification.isRead && (
              <span
                className="mt-1.5 h-2 w-2 rounded-full shrink-0"
                style={{ backgroundColor: "#121936" }}
              />
            )}
          </div>
          <p
            className="text-xs text-right mt-0.5 line-clamp-2"
            style={{ color: "rgba(0, 0, 0, 0.6)", lineHeight: "18px" }}
          >
            {notification.body}
          </p>
          <p
            className="text-xs text-right mt-1"
            style={{ color: "#A8ABB2", lineHeight: "18px" }}
          >
            {formatRelativeTime(notification.createdAt)}
          </p>
        </div>
      </div>
    </button>
  );
}

export function PortalNotificationsDropdown() {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const [selectedNotification, setSelectedNotification] =
    useState<PortalNotificationItem | null>(null);

  const { data, isLoading } = useGetMyNotificationsQuery({ page: 1, limit: 5 });
  const [markAsRead] = useMarkAsReadMutation();
  const [markAllAsRead] = useMarkAllAsReadMutation();

  async function handleSelect(notification: PortalNotificationItem) {
    if (!notification.isRead) {
      try {
        await markAsRead(notification.id);
      } catch {
        // ignore
      }
    }
    setSelectedNotification(notification);
  }

  function handleNavigate() {
    if (!selectedNotification) return;
    const url = resolvePortalUrl(
      selectedNotification.entityType,
      selectedNotification.entityId,
    );
    if (url) {
      setSelectedNotification(null);
      dispatch(setDropdownOpen(false));
      router.push(url);
    }
  }

  const notifications = (data as unknown as { data?: PortalNotificationItem[] })?.data ?? [];
  const hasUnread = notifications.some((n) => !n.isRead);

  return (
    <>
      <div
        className="absolute top-full mt-2 overflow-hidden z-50"
        dir="rtl"
        style={{
          width: 360,
          left: 0,
          background: "#FFFFFF",
          border: "1.5px solid #E1E4EA",
          borderRadius: 20,
          boxShadow: "0 4px 24px rgba(0, 0, 0, 0.08)",
        }}
      >
        <div className="flex items-center justify-between px-4 py-3 border-b border-portal-divider">
          <span
            className="font-semibold"
            style={{
              fontSize: 18,
              fontWeight: 600,
              lineHeight: "27px",
              color: "#000000",
            }}
          >
            الإشعارات
          </span>
          {hasUnread && (
            <button
              className="flex items-center gap-1 px-3 py-1 rounded-xl text-xs border-none bg-transparent hover:bg-gray-100 transition-colors"
              style={{
                fontSize: 14,
                fontWeight: 500,
                color: "#525866",
                lineHeight: "21px",
              }}
              onClick={() => markAllAsRead()}
            >
              <CheckCheck style={{ width: 16, height: 16 }} />
              تعليم الكل كمقروء
            </button>
          )}
        </div>

        <div className="max-h-80 overflow-y-auto">
          {isLoading ? (
            <div className="p-4 space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="animate-pulse">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-full bg-gray-200 shrink-0" />
                    <div className="flex-1 space-y-2">
                      <div className="h-4 bg-gray-200 rounded w-3/4" />
                      <div className="h-3 bg-gray-100 rounded w-full" />
                      <div className="h-3 bg-gray-100 rounded w-1/4" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10" style={{ color: "#A8ABB2" }}>
              <BellOff style={{ width: 40, height: 40, marginBottom: 8 }} />
              <p style={{ fontSize: 16, lineHeight: "24px" }}>لا توجد إشعارات</p>
            </div>
          ) : (
            notifications.map((n) => (
              <NotificationListItem
                key={n.id}
                notification={n}
                onSelect={handleSelect}
              />
            ))
          )}
        </div>

        <div className="px-4 py-3 border-t border-portal-divider">
          <Link
            href="/portal/notifications"
            className="text-right block hover:underline"
            style={{
              fontSize: 16,
              fontWeight: 500,
              color: "#121936",
              lineHeight: "24px",
            }}
            onClick={() => dispatch(setDropdownOpen(false))}
          >
            عرض جميع الإشعارات
          </Link>
        </div>
      </div>

      {selectedNotification && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40" onClick={() => setSelectedNotification(null)}>
          <div
            className="mx-4 overflow-hidden"
            dir="rtl"
            style={{
              width: 420,
              maxWidth: "100%",
              background: "#FFFFFF",
              borderRadius: 24,
              border: "1.5px solid #E1E4EA",
              boxShadow: "0 8px 40px rgba(0, 0, 0, 0.12)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-5 border-b border-portal-divider">
              <h3
                className="text-right"
                style={{
                  fontSize: 20,
                  fontWeight: 600,
                  lineHeight: "30px",
                  color: "#000000",
                }}
              >
                {selectedNotification.title}
              </h3>
              <p
                className="text-right mt-1"
                style={{
                  fontSize: 14,
                  lineHeight: "21px",
                  color: "#A8ABB2",
                }}
              >
                {formatRelativeTime(selectedNotification.createdAt)}
              </p>
            </div>
            <div className="p-5">
              <p
                className="text-right whitespace-pre-wrap"
                style={{
                  fontSize: 16,
                  fontWeight: 400,
                  lineHeight: "27px",
                  color: "rgba(0, 0, 0, 0.6)",
                }}
              >
                {selectedNotification.body}
              </p>
            </div>
            <div className="flex flex-row-reverse gap-2 p-5 pt-0">
              {resolvePortalUrl(selectedNotification.entityType, selectedNotification.entityId) && (
                <button
                  className="flex items-center gap-2 px-5 py-2.5 rounded-2xl text-white"
                  style={{
                    backgroundColor: "#121936",
                    fontSize: 16,
                    fontWeight: 500,
                    lineHeight: "24px",
                  }}
                  onClick={handleNavigate}
                >
                  <ExternalLink style={{ width: 16, height: 16 }} />
                  {getPrimaryActionLabel(selectedNotification.entityType)}
                </button>
              )}
              <button
                className="px-5 py-2.5 rounded-2xl"
                style={{
                  backgroundColor: "#F9FAFB",
                  border: "1.5px solid #E1E4EA",
                  color: "#525866",
                  fontSize: 16,
                  fontWeight: 500,
                  lineHeight: "24px",
                }}
                onClick={() => setSelectedNotification(null)}
              >
                إغلاق
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
