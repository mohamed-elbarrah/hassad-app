"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  AlertCircle,
  Bell,
  CheckCheck,
  CreditCard,
  ExternalLink,
  FileText,
  Inbox,
  Layout,
  MessageSquare,
  Package,
  Receipt,
  TrendingUp,
} from "lucide-react";
import { toast } from "sonner";
import { NotificationEventType } from "@hassad/shared";
import { PortalEmptyState } from "@/components/portal/shared/PortalEmptyState";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  useGetMyNotificationsQuery,
  useMarkAsReadMutation,
  useMarkAllAsReadMutation,
  type PortalNotificationItem,
} from "@/features/portal-notifications/portalNotificationsApi";
import { cn } from "@/lib/utils";
import { formatRelativeTime } from "@/lib/format";

type FilterTab = "all" | "action" | "info";

const ENTITY_ICON_MAP: Record<string, React.ReactNode> = {
  proposal: <FileText />,
  contract: <FileText />,
  invoice: <Receipt />,
  INVOICE: <Receipt />,
  deliverable: <Package />,
  project: <Layout />,
  campaign: <TrendingUp />,
  conversation: <MessageSquare />,
  payment: <CreditCard />,
  PAYMENT: <CreditCard />,
  default: <AlertCircle />,
};

function getEntityIcon(entityType: string | null | undefined) {
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

function NotificationRow({
  notification,
  isExpanded,
  onToggle,
  onNavigate,
}: {
  notification: PortalNotificationItem;
  isExpanded: boolean;
  onToggle: () => void;
  onNavigate: () => void;
}) {
  const isAction = notification.eventType
    ? isActionRequired(notification.entityType, notification.eventType)
    : isActionRequired(notification.entityType, null);

  return (
    <div className={cn("px-6 py-4", !notification.isRead && "bg-muted/50")}>
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-start gap-3 text-right"
      >
        <div className="flex size-11 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground [&_svg]:size-5">
          {getEntityIcon(notification.entityType)}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-3">
            <p
              className={cn(
                "min-w-0 text-base leading-snug",
                notification.isRead
                  ? "font-normal text-muted-foreground"
                  : "font-medium",
              )}
            >
              {notification.title}
            </p>
            <div className="flex shrink-0 items-center gap-2">
              {isAction && (
                <Badge variant="outline" className="text-info">
                  مطلوب إجراء
                </Badge>
              )}
              {!notification.isRead && (
                <span
                  aria-hidden="true"
                  className="size-2 rounded-full bg-primary"
                />
              )}
            </div>
          </div>
          <p className="mt-1 text-sm leading-6 text-muted-foreground">
            {isExpanded
              ? notification.body
              : notification.body.length > 120
                ? notification.body.substring(0, 117) + "..."
                : notification.body}
          </p>
        </div>
      </button>
      <div className="mt-2 flex items-center justify-between ps-14">
        <p className="text-xs text-muted-foreground">
          {formatRelativeTime(notification.createdAt)}
        </p>
        {isAction && (
          <Button variant="ghost" size="sm" onClick={onNavigate}>
            <ExternalLink data-icon="inline-end" />
            {getPrimaryActionLabel(notification.entityType)}
          </Button>
        )}
      </div>
    </div>
  );
}

export default function PortalNotificationsPage() {
  const router = useRouter();
  const [filter, setFilter] = useState<FilterTab>("all");
  const [expandedId, setExpandedId] = useState<string | null>(null);

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
      const requiresAction = n.eventType
        ? isActionRequired(n.entityType, n.eventType)
        : isActionRequired(n.entityType, null);
      return filter === "action" ? requiresAction : !requiresAction;
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

  function handleToggle(n: PortalNotificationItem) {
    if (!n.isRead) void handleMarkRead(n.id);
    setExpandedId((current) => (current === n.id ? null : n.id));
  }

  return (
    <main dir="rtl" className="flex flex-col gap-6">
      <Card>
        <CardHeader className="gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-start gap-3">
            <div className="flex size-11 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Bell />
            </div>
            <div className="flex flex-col gap-1">
              <CardTitle className="text-2xl">الإشعارات</CardTitle>
              <CardDescription>
                جميع الإشعارات الواردة، الإجراءات المطلوبة منك، والمعلومات
                العامة حول مشاريعك.
              </CardDescription>
            </div>
          </div>
          {unreadCount > 0 && (
            <Button variant="outline" onClick={() => markAllAsRead()}>
              <CheckCheck data-icon="inline-start" />
              تعليم الكل كمقروء
            </Button>
          )}
        </CardHeader>
      </Card>

      <Card>
        <CardHeader className="gap-4">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-center gap-3">
              <Inbox className="size-5 text-muted-foreground" />
              <div className="flex flex-col gap-1">
                <CardTitle className="text-lg">صندوق الوارد</CardTitle>
                <CardDescription>
                  {unreadCount > 0
                    ? `${unreadCount} إشعار غير مقروء`
                    : "لا يوجد إشعارات غير مقروءة"}
                </CardDescription>
              </div>
            </div>
            <Tabs
              value={filter}
              onValueChange={(value) => setFilter(value as FilterTab)}
            >
              <TabsList className="h-auto flex-wrap">
                <TabsTrigger value="all">الكل</TabsTrigger>
                <TabsTrigger value="action">إجراءات مطلوبة</TabsTrigger>
                <TabsTrigger value="info">معلومات عامة</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </CardHeader>

        {isLoading ? (
          <CardContent className="flex flex-col gap-3 pt-6">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="flex items-start gap-3">
                <Skeleton className="size-11 shrink-0 rounded-full" />
                <div className="flex flex-1 flex-col gap-2">
                  <Skeleton className="h-5 w-2/3" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-3 w-1/4" />
                </div>
              </div>
            ))}
          </CardContent>
        ) : filteredNotifications.length === 0 ? (
          <CardContent className="pt-6">
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
          </CardContent>
        ) : (
          <div>
            {filteredNotifications.map((n, index) => (
              <div key={n.id}>
                {index > 0 && <Separator />}
                <NotificationRow
                  notification={n}
                  isExpanded={expandedId === n.id}
                  onToggle={() => handleToggle(n)}
                  onNavigate={() => handleNavigate(n)}
                />
              </div>
            ))}
          </div>
        )}
      </Card>
    </main>
  );
}
