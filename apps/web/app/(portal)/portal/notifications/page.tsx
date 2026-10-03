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
import { isClientActionNotificationEvent } from "@hassad/shared";
import { PortalEmptyState } from "@/components/portal/shared/PortalEmptyState";
import { PageHeader } from "@/components/common/PageHeader";
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
import { notificationPresentation, portalErrorMessage } from "@/lib/i18n";
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
  marketing_strategy: <TrendingUp />,
  conversation: <MessageSquare />,
  payment: <CreditCard />,
  PAYMENT: <CreditCard />,
  default: <AlertCircle />,
};

function normalizeEntityType(entityType: string | null | undefined): string {
  return entityType?.trim().toLowerCase() ?? "";
}

function getEntityIcon(entityType: string | null | undefined) {
  const type = normalizeEntityType(entityType);
  return ENTITY_ICON_MAP[type] ?? ENTITY_ICON_MAP.default;
}

function resolvePortalUrl(
  entityType: string | null | undefined,
  entityId: string | null | undefined,
): string | null {
  const type = normalizeEntityType(entityType);
  if (!type || !entityId) return null;
  if (type === "proposal") return `/portal/proposals/${entityId}`;
  if (type === "contract") return `/portal/contracts/${entityId}`;
  if (type === "deliverable") return `/portal/deliverables/${entityId}`;
  if (type === "project") return `/portal/projects`;
  if (type === "campaign") return `/portal/campaigns/${entityId}`;
  if (type === "marketing_strategy")
    return `/portal/marketing-strategies/${entityId}`;
  if (type === "invoice") return `/portal/invoices/${entityId}`;
  if (type === "conversation") return `/portal/projects`;
  if (type === "payment") return `/portal/finance`;
  return null;
}

function getPrimaryActionLabel(entityType: string | null | undefined): string {
  const type = normalizeEntityType(entityType);
  if (type === "proposal") return "مراجعة العرض";
  if (type === "contract") return "مراجعة العقد";
  if (type === "marketing_strategy") return "مراجعة الاستراتيجية";
  if (type === "deliverable") return "مراجعة التسليمة";
  if (type === "invoice") return "دفع الفاتورة";
  if (type === "payment") return "عرض الفاتورة";
  if (type === "project") return "متابعة المشروع";
  if (type === "campaign") return "عرض الحملة";
  return "عرض التفاصيل";
}

function isActionRequired(
  entityType: string | null | undefined,
  eventType: string | null | undefined,
): boolean {
  if (isClientActionNotificationEvent(eventType)) return true;
  const type = normalizeEntityType(entityType);
  if (type === "proposal") {
    return eventType ? eventType === "PROPOSAL_SENT" : true;
  }
  if (type === "contract") {
    return eventType ? eventType === "CONTRACT_SENT" : true;
  }
  if (type === "marketing_strategy") {
    return eventType ? eventType === "MARKETING_STRATEGY_SENT" : true;
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
  const presentation = notificationPresentation(
    notification.eventType,
    notification.metadata,
  );
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
              {presentation.title}
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
              ? presentation.body
              : presentation.body.length > 120
                ? presentation.body.substring(0, 117) + "..."
                : presentation.body}
          </p>
        </div>
      </button>
      <div className="mt-2 flex items-center justify-between ps-14">
        <p className="text-xs text-muted-foreground">
          {formatRelativeTime(String(notification.createdAt))}
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
    } catch (error) {
      toast.error(portalErrorMessage(error));
    }
  }

  async function handleNavigate(n: PortalNotificationItem) {
    if (!n.isRead) await handleMarkRead(n.id);
    const metadata = n.metadata as Record<string, unknown> | null | undefined;
    const metadataUrl = metadata?.actionUrl;
    const url =
      typeof metadataUrl === "string"
        ? metadataUrl
        : resolvePortalUrl(n.entityType, n.entityId);
    if (url) router.push(url);
  }

  function handleToggle(n: PortalNotificationItem) {
    if (!n.isRead) void handleMarkRead(n.id);
    setExpandedId((current) => (current === n.id ? null : n.id));
  }

  return (
    <main dir="rtl" className="flex flex-col gap-6">
      <PageHeader
        title="الإشعارات"
        description="جميع الإشعارات الواردة، الإجراءات المطلوبة منك، والمعلومات العامة حول مشاريعك."
        icon={Bell}
        actions={
          unreadCount > 0 ? (
            <Button variant="outline" onClick={() => markAllAsRead()}>
              <CheckCheck data-icon="inline-start" />
              تعليم الكل كمقروء
            </Button>
          ) : null
        }
      />

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
                filter === "action"
                  ? "لا توجد إجراءات مطلوبة"
                  : "لا توجد إشعارات"
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
