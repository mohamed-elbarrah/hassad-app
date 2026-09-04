"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import { Bell, ChevronDown, LogOut, Moon, Settings } from "lucide-react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";
import { Skeleton } from "@/components/ui/skeleton";
import { useLogoutMutation } from "@/features/auth/authApi";
import { logout } from "@/features/auth/authSlice";
import { useAppDispatch, useAppSelector } from "@/lib/hooks";
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

function getInitials(name: string) {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}

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

function PortalUserMenu() {
  const { user } = useAppSelector((state) => state.auth);
  const dispatch = useAppDispatch();
  const router = useRouter();
  const { state, isMobile, setOpenMobile } = useSidebar();
  const [logoutMutation] = useLogoutMutation();

  if (!user) return null;

  const handleLogout = async () => {
    try {
      await logoutMutation().unwrap();
    } catch {
      // Local sign-out must still complete when the remote session is unavailable.
    }
    dispatch(logout());
    router.replace("/login");
  };

  return (
    <DropdownMenu dir="rtl">
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          className="h-auto w-full justify-start px-2 py-2 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:px-0"
          aria-label={user.name}
          title={state === "collapsed" ? user.name : undefined}
        >
          <Avatar className="size-9">
            <AvatarImage src={user.avatarUrl ?? undefined} alt={user.name} />
            <AvatarFallback>{getInitials(user.name)}</AvatarFallback>
          </Avatar>
          <span className="min-w-0 flex-1 truncate text-start group-data-[collapsible=icon]:hidden">
            {user.name}
          </span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel className="truncate">{user.email}</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuItem
            onSelect={() => {
              if (isMobile) setOpenMobile(false);
              router.push("/portal/account");
            }}
          >
            <Settings />
            الإعدادات
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={handleLogout}>
            <LogOut />
            تسجيل الخروج
          </DropdownMenuItem>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
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
          className="relative size-10 rounded-full border border-border bg-background hover:bg-accent"
          aria-label={count > 0 ? `الإشعارات، ${count} غير مقروء` : "الإشعارات"}
        >
          <Bell aria-hidden="true" />
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
  showIcon = true,
}: {
  item: PortalNavItem;
  showIcon?: boolean;
}) {
  const pathname = usePathname();
  const { isMobile, setOpenMobile } = useSidebar();
  const Icon = item.icon;
  const active = isPortalActiveLink(item.href, pathname);

  return (
    <SidebarMenuItem>
      <SidebarMenuButton
        asChild
        size="lg"
        isActive={active}
        tooltip={{ children: item.label, side: "left" }}
        className={cn(
          "text-start",
          !showIcon && "ps-10",
          "group-data-[collapsible=icon]:!size-10 group-data-[collapsible=icon]:!p-0 group-data-[collapsible=icon]:justify-center",
        )}
      >
        <Link
          href={item.href}
          aria-current={active ? "page" : undefined}
          onClick={() => {
            if (isMobile) setOpenMobile(false);
          }}
        >
          {showIcon ? <Icon aria-hidden="true" /> : null}
          <span className="group-data-[collapsible=icon]:hidden">
            {item.label}
          </span>
        </Link>
      </SidebarMenuButton>
    </SidebarMenuItem>
  );
}

export function PortalSidebar() {
  const pathname = usePathname();
  const { state } = useSidebar();
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
      <SidebarHeader className="border-b border-sidebar-border px-4 py-5 group-data-[collapsible=icon]:px-2">
        <Link
          href="/portal"
          className="flex w-full items-center gap-3 rounded-xl px-1.5 py-1.5 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:px-0"
          aria-label="الرئيسية"
        >
          <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-sidebar-accent p-1">
            <Image
              src="/masar.svg"
              alt="مسار"
              width={44}
              height={44}
              priority
              className="size-full object-contain"
            />
          </span>
          <div className="min-w-0 group-data-[collapsible=icon]:hidden">
            <p className="truncate text-sm font-semibold text-sidebar-foreground">
              Hassad Platform
            </p>
            <p className="truncate text-xs text-sidebar-foreground/70">
              بوابة العميل
            </p>
          </div>
        </Link>
      </SidebarHeader>
      <nav aria-label="التنقل الرئيسي" className="flex min-h-0 flex-1 flex-col">
        <SidebarContent className="px-3 py-4">
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
                          <span className="group-data-[collapsible=icon]:hidden">
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
                                  active &&
                                    "bg-accent font-medium text-accent-foreground",
                                )}
                              >
                                <Link
                                  href={item.href}
                                  aria-current={active ? "page" : undefined}
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
                            className="text-start"
                          >
                            <Icon aria-hidden="true" />
                            <span>{group.label}</span>
                            <ChevronDown
                              aria-hidden="true"
                              className="ms-auto transition-transform group-data-[state=open]/collapsible:rotate-180"
                            />
                          </SidebarMenuButton>
                        </CollapsibleTrigger>
                      </SidebarMenuItem>
                    </SidebarMenu>
                    <CollapsibleContent>
                      <SidebarMenu className="ms-4 gap-1 border-s ps-2">
                        {group.items.map((item) => (
                          <PortalNavLink
                            key={item.href}
                            item={item}
                            showIcon={false}
                          />
                        ))}
                      </SidebarMenu>
                    </CollapsibleContent>
                  </Collapsible>
                </SidebarMenuItem>
              );
            })}
          </SidebarMenu>
        </SidebarContent>
      </nav>
      <SidebarFooter className="border-t border-sidebar-border p-3">
        <PortalUserMenu />
      </SidebarFooter>
    </Sidebar>
  );
}

export function PortalHeader() {
  const { user } = useAppSelector((state) => state.auth);
  const { resolvedTheme, setTheme } = useTheme();
  const firstName = user?.name.split(" ")[0] ?? "";

  return (
    <header className="z-20 flex h-16 shrink-0 items-center gap-3 border-b border-border bg-background/95 px-4 backdrop-blur supports-[backdrop-filter]:bg-background/80 lg:h-20 lg:px-6">
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
          className="size-10 rounded-full border border-border bg-background hover:bg-accent"
          aria-label="تبديل المظهر"
          onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
        >
          <Moon aria-hidden="true" />
        </Button>
        <PortalNotificationMenu />
      </div>
    </header>
  );
}
