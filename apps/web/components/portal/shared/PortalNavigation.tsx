"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import { Bell, ChevronDown, Moon } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { notificationPresentation } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import {
  Sidebar,
  SidebarContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";
import { Skeleton } from "@/components/ui/skeleton";
import { useAppSelector } from "@/lib/hooks";
import {
  useGetMyNotificationsQuery,
  useGetUnreadCountQuery,
  useMarkAsReadMutation,
} from "@/features/portal-notifications/portalNotificationsApi";
import {
  PORTAL_NAV_GROUPS,
  PORTAL_STANDALONE_ITEMS,
  isPortalActiveLink,
  type PortalNavItem,
} from "@/lib/portal-navigation";
import { SidebarAccountMenu } from "@/components/shared/navigation/SidebarAccountMenu";
import { SidebarBrand } from "@/components/shared/navigation/SidebarBrand";

function resolveNotificationUrl(
  entityType?: string | null,
  entityId?: string | null,
) {
  if (!entityType || !entityId) return null;
  if (entityType === "proposal") return `/portal/proposals/${entityId}`;
  if (entityType === "contract") return `/portal/contracts/${entityId}`;
  if (entityType === "deliverable") return `/portal/deliverables/${entityId}`;
  if (entityType === "campaign") return `/portal/campaigns/${entityId}`;
  if (entityType === "marketing_strategy")
    return `/portal/marketing-strategies/${entityId}`;
  if (entityType === "project" || entityType === "conversation")
    return "/portal/projects";
  if (
    entityType === "invoice" ||
    entityType === "INVOICE" ||
    entityType === "payment" ||
    entityType === "PAYMENT"
  )
    return "/portal/finance";
  return null;
}

function PortalNotificationMenu() {
  const router = useRouter();
  const { isAuthenticated } = useAppSelector((state) => state.auth);
  const { data: unreadData } = useGetUnreadCountQuery(undefined, {
    skip: !isAuthenticated,
  });
  const { data, isLoading } = useGetMyNotificationsQuery(
    { page: 1, limit: 5 },
    { skip: !isAuthenticated },
  );
  const [markAsRead] = useMarkAsReadMutation();
  const notifications =
    (
      data as unknown as {
        data?: Array<{
          id: string;
          title: string;
          body: string;
          isRead: boolean;
          entityType?: string | null;
          entityId?: string | null;
          eventType?: string;
          metadata?: Record<string, unknown> | null;
        }>;
      }
    )?.data ?? [];
  const count = unreadData?.count ?? 0;

  const openNotification = async (
    notification: (typeof notifications)[number],
  ) => {
    if (!notification.isRead) {
      try {
        await markAsRead(notification.id).unwrap();
      } catch {
        // Navigation should still work when marking the notification fails.
      }
    }
    router.push(
      resolveNotificationUrl(notification.entityType, notification.entityId) ??
        "/portal/notifications",
    );
  };

  return (
    <DropdownMenu dir="rtl">
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative size-10 min-h-11 min-w-11 rounded-full border border-border bg-background hover:bg-accent"
          aria-label={count > 0 ? `الإشعارات، ${count} غير مقروء` : "الإشعارات"}
        >
          <Bell aria-hidden="true" data-icon="inline-start" />
          {count > 0 && (
            <Badge
              variant="destructive"
              className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full px-1"
            >
              {count > 9 ? "9+" : count}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        sideOffset={8}
        collisionPadding={16}
        className="w-80"
        aria-label="قائمة الإشعارات"
      >
        <DropdownMenuLabel>الإشعارات</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {isLoading ? (
          <div className="flex flex-col gap-3 p-3">
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
          </div>
        ) : notifications.length ? (
          <DropdownMenuGroup>
            {notifications.map((notification) => {
              const presentation = notificationPresentation(
                notification.eventType,
                notification.metadata,
              );
              return (
                <DropdownMenuItem
                  key={notification.id}
                  className="items-start"
                  onSelect={() => openNotification(notification)}
                >
                  <span className="flex min-w-0 flex-1 flex-col gap-1">
                    <span className="truncate font-medium">
                      {presentation.title}
                    </span>
                    <span className="line-clamp-2 text-xs text-muted-foreground">
                      {presentation.body}
                    </span>
                  </span>
                  {!notification.isRead && (
                    <Badge variant="secondary">جديد</Badge>
                  )}
                </DropdownMenuItem>
              );
            })}
          </DropdownMenuGroup>
        ) : (
          <p className="p-4 text-center text-sm text-muted-foreground">
            لا توجد إشعارات جديدة.
          </p>
        )}
        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={() => router.push("/portal/notifications")}>
          عرض كل الإشعارات
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function PortalNavLink({
  item,
  nested = false,
}: {
  item: PortalNavItem;
  nested?: boolean;
}) {
  const pathname = usePathname();
  const { isMobile, setOpenMobile } = useSidebar();
  const Icon = item.icon;
  const active = isPortalActiveLink(item.href, pathname);
  const handleClick = () => {
    if (isMobile) setOpenMobile(false);
  };

  if (nested) {
    return (
      <SidebarMenuSubItem>
        <SidebarMenuSubButton asChild isActive={active} size="md">
          <Link
            href={item.href}
            aria-current={active ? "page" : undefined}
            onClick={handleClick}
          >
            <span className="min-w-0 truncate">{item.label}</span>
          </Link>
        </SidebarMenuSubButton>
      </SidebarMenuSubItem>
    );
  }

  return (
    <SidebarMenuItem>
      <SidebarMenuButton
        asChild
        size="lg"
        isActive={active}
        tooltip={{ children: item.label, side: "left" }}
        className="text-start group-data-[collapsible=icon]:!size-10 group-data-[collapsible=icon]:!p-0 group-data-[collapsible=icon]:justify-center"
      >
        <Link
          href={item.href}
          aria-current={active ? "page" : undefined}
          onClick={handleClick}
        >
          <Icon aria-hidden="true" />
          <span className="min-w-0 flex-1 truncate group-data-[collapsible=icon]:hidden">
            {item.label}
          </span>
        </Link>
      </SidebarMenuButton>
    </SidebarMenuItem>
  );
}

export function PortalSidebar() {
  const pathname = usePathname();
  const { state, isMobile, setOpenMobile } = useSidebar();
  const isCollapsed = state === "collapsed";
  const activeGroup = useMemo(
    () =>
      PORTAL_NAV_GROUPS.find((group) =>
        group.items.some((item) => isPortalActiveLink(item.href, pathname)),
      )?.key ?? null,
    [pathname],
  );
  const [openGroup, setOpenGroup] = useState<string | null>(activeGroup);

  useEffect(() => {
    const frame = requestAnimationFrame(() => setOpenGroup(activeGroup));
    return () => cancelAnimationFrame(frame);
  }, [activeGroup]);

  return (
    <Sidebar
      side="right"
      variant="inset"
      collapsible="icon"
      className="border-l border-sidebar-border"
    >
      <SidebarBrand href="/portal" alt="مسار" subtitle="بوابة العميل" />
      <nav aria-label="التنقل الرئيسي" className="flex min-h-0 flex-1 flex-col">
        <SidebarContent className="min-w-0 px-3 py-4">
          <SidebarMenu className="gap-2">
            {PORTAL_STANDALONE_ITEMS.map((item) => (
              <PortalNavLink key={item.href} item={item} />
            ))}
            {PORTAL_NAV_GROUPS.map((group) => {
              const Icon = group.icon;
              const isActive = group.items.some((item) =>
                isPortalActiveLink(item.href, pathname),
              );
              const isOpen = openGroup === group.key;

              if (isCollapsed) {
                return (
                  <SidebarMenuItem key={group.key}>
                    <DropdownMenu dir="rtl">
                      <DropdownMenuTrigger asChild>
                        <SidebarMenuButton
                          size="lg"
                          isActive={isActive}
                          tooltip={{ children: group.label, side: "left" }}
                          aria-label={group.label}
                          className="justify-center text-start group-data-[collapsible=icon]:!size-10 group-data-[collapsible=icon]:!p-0"
                        >
                          <Icon aria-hidden="true" />
                          <span className="min-w-0 flex-1 truncate group-data-[collapsible=icon]:hidden">
                            {group.label}
                          </span>
                        </SidebarMenuButton>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent
                        side="left"
                        align="start"
                        className="min-w-48"
                      >
                        <DropdownMenuLabel>{group.label}</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuGroup>
                          {group.items.map((item) => {
                            const active = isPortalActiveLink(
                              item.href,
                              pathname,
                            );
                            return (
                              <DropdownMenuItem
                                key={item.href}
                                asChild
                                className={cn(
                                  "min-h-11 data-[highlighted]:bg-sidebar-hover data-[highlighted]:text-sidebar-foreground",
                                  active &&
                                    "bg-sidebar-active font-medium text-sidebar-active-foreground",
                                )}
                              >
                                <Link
                                  href={item.href}
                                  aria-current={active ? "page" : undefined}
                                  onClick={() => {
                                    if (isMobile) setOpenMobile(false);
                                  }}
                                >
                                  {item.label}
                                </Link>
                              </DropdownMenuItem>
                            );
                          })}
                        </DropdownMenuGroup>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </SidebarMenuItem>
                );
              }

              return (
                <SidebarMenuItem key={group.key}>
                  <Collapsible
                    className="group/collapsible"
                    open={isOpen}
                    onOpenChange={(open) =>
                      setOpenGroup(open ? group.key : null)
                    }
                  >
                    <SidebarMenu>
                      <SidebarMenuItem>
                        <CollapsibleTrigger asChild>
                          <SidebarMenuButton
                            size="lg"
                            isActive={isActive}
                            tooltip={{ children: group.label, side: "left" }}
                            className="text-start data-[active=true]:bg-sidebar-active/80 data-[active=true]:text-sidebar-foreground"
                          >
                            <Icon aria-hidden="true" />
                            <span className="min-w-0 flex-1 truncate">{group.label}</span>
                            <ChevronDown
                              aria-hidden="true"
                              className="ms-auto transition-transform group-data-[state=open]/collapsible:rotate-180"
                            />
                          </SidebarMenuButton>
                        </CollapsibleTrigger>
                      </SidebarMenuItem>
                    </SidebarMenu>
                    <CollapsibleContent>
                      <SidebarMenuSub>
                        {group.items.map((item) => (
                          <PortalNavLink key={item.href} item={item} nested />
                        ))}
                      </SidebarMenuSub>
                    </CollapsibleContent>
                  </Collapsible>
                </SidebarMenuItem>
              );
            })}
          </SidebarMenu>
        </SidebarContent>
      </nav>
      <SidebarAccountMenu settingsHref="/portal/account" />
    </Sidebar>
  );
}

export function PortalHeader() {
  const { user } = useAppSelector((state) => state.auth);
  const { resolvedTheme, setTheme } = useTheme();
  const firstName = user?.name.split(" ")[0] ?? "";

  return (
    <header className="z-20 flex h-16 shrink-0 items-center gap-3 border-b border-border bg-background/95 px-4 backdrop-blur supports-[backdrop-filter]:bg-background/80 ">
      <div className="flex min-w-0 flex-1 items-center gap-3">
        <SidebarTrigger className="!size-11 shrink-0" />
        <div className="min-w-0">
          <p className="text-xs font-medium text-muted-foreground">
            بوابة العميل
          </p>
          <h1 className="truncate text-base font-semibold text-foreground">
            {user ? `مرحبًا، ${firstName}` : "بوابة العميل"}
          </h1>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="icon"
          className="size-10 min-h-11 min-w-11 rounded-full border border-border bg-background hover:bg-accent"
          aria-label="تبديل المظهر"
          onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
        >
          <Moon aria-hidden="true" data-icon="inline-start" />
        </Button>
        <PortalNotificationMenu />
      </div>
    </header>
  );
}
