"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Bell,
  ChevronDown,
  LogOut,
  Menu,
  Moon,
  Settings,
  UserRound,
} from "lucide-react";

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
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
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
  PORTAL_BOTTOM_PRIMARY,
  PORTAL_MORE_ITEMS,
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
          className="h-auto w-full justify-start px-2 py-2"
        >
          <Avatar className="size-9">
            <AvatarImage src={user.avatarUrl ?? undefined} alt={user.name} />
            <AvatarFallback>{getInitials(user.name)}</AvatarFallback>
          </Avatar>
          <span className="min-w-0 flex-1 truncate text-start">
            {user.name}
          </span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel className="truncate">{user.email}</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuItem onSelect={() => router.push("/portal/account")}>
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
  const { data, isLoading } = useGetMyNotificationsQuery({ page: 1, limit: 5 });
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
        }>;
      }
    )?.data ?? [];
  const count = unreadData?.count ?? 0;

  const openNotification = async (
    notification: (typeof notifications)[number],
  ) => {
    if (!notification.isRead) await markAsRead(notification.id);
    router.push(
      resolveNotificationUrl(notification.entityType, notification.entityId) ??
        "/portal/notifications",
    );
  };

  return (
    <DropdownMenu dir="rtl">
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="icon"
          className="relative"
          aria-label="الإشعارات"
        >
          <Bell />
          {count > 0 && (
            <Badge className="absolute -end-2 -top-2 min-w-5 justify-center px-1">
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
            {notifications.map((notification) => (
              <DropdownMenuItem
                key={notification.id}
                className="items-start"
                onSelect={() => openNotification(notification)}
              >
                <UserRound className="mt-0.5" />
                <span className="flex min-w-0 flex-1 flex-col gap-1">
                  <span className="truncate font-medium">
                    {notification.title}
                  </span>
                  <span className="line-clamp-2 text-xs text-muted-foreground">
                    {notification.body}
                  </span>
                </span>
                {!notification.isRead && (
                  <Badge variant="secondary">جديد</Badge>
                )}
              </DropdownMenuItem>
            ))}
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

function PortalNavLink({ item }: { item: PortalNavItem }) {
  const pathname = usePathname();
  const Icon = item.icon;

  return (
    <SidebarMenuItem>
      <SidebarMenuButton
        asChild
        isActive={isPortalActiveLink(item.href, pathname)}
      >
        <Link href={item.href}>
          <Icon />
          <span>{item.label}</span>
        </Link>
      </SidebarMenuButton>
    </SidebarMenuItem>
  );
}

export function PortalSidebar() {
  const pathname = usePathname();
  const activeGroup = useMemo(
    () =>
      PORTAL_NAV_GROUPS.find((group) =>
        group.items.some((item) => isPortalActiveLink(item.href, pathname)),
      )?.key ?? null,
    [pathname],
  );
  const [openGroup, setOpenGroup] = useState<string | null>(activeGroup);

  useEffect(() => setOpenGroup(activeGroup), [activeGroup]);

  return (
    <Sidebar
      side="right"
      collapsible="none"
      className="hidden border-l lg:flex"
    >
      <SidebarHeader className="items-center border-b px-4 py-5">
        <Image src="/masar.svg" alt="مسار" width={72} height={72} priority />
      </SidebarHeader>
      <SidebarContent>
        <ScrollArea className="h-full">
          <SidebarMenu className="p-3">
            {PORTAL_STANDALONE_ITEMS.map((item) => (
              <PortalNavLink key={item.href} item={item} />
            ))}
            {PORTAL_NAV_GROUPS.map((group) => {
              const Icon = group.icon;
              const isActive = group.items.some((item) =>
                isPortalActiveLink(item.href, pathname),
              );
              const isOpen = openGroup === group.key;

              return (
                <Collapsible
                  key={group.key}
                  open={isOpen}
                  onOpenChange={(open) => setOpenGroup(open ? group.key : null)}
                >
                  <SidebarMenuItem>
                    <CollapsibleTrigger asChild>
                      <SidebarMenuButton isActive={isActive}>
                        <Icon />
                        <span>{group.label}</span>
                        <ChevronDown className="ms-auto transition-transform data-[state=open]:rotate-180" />
                      </SidebarMenuButton>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <SidebarMenu className="ms-4 border-s ps-2">
                        {group.items.map((item) => (
                          <PortalNavLink key={item.href} item={item} />
                        ))}
                      </SidebarMenu>
                    </CollapsibleContent>
                  </SidebarMenuItem>
                </Collapsible>
              );
            })}
          </SidebarMenu>
        </ScrollArea>
      </SidebarContent>
      <SidebarFooter className="border-t p-3">
        <PortalUserMenu />
      </SidebarFooter>
    </Sidebar>
  );
}

export function PortalHeader() {
  const { user } = useAppSelector((state) => state.auth);
  const firstName = user?.name.split(" ")[0] ?? "";

  return (
    <header className="flex min-h-16 items-center justify-between border-b bg-background px-4 py-3 lg:px-6">
      <div className="hidden flex-col md:flex">
        <span className="font-semibold">مرحباً {firstName}</span>
        <span className="text-sm text-muted-foreground">
          مشروعك يسير بشكل جيد
        </span>
      </div>
      <div className="ms-auto flex items-center gap-2">
        <Button variant="outline" size="icon" aria-label="تبديل المظهر">
          <Moon />
        </Button>
        <PortalNotificationMenu />
      </div>
    </header>
  );
}

export function PortalMobileNav() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const isMoreActive = !PORTAL_BOTTOM_PRIMARY.some((item) =>
    isPortalActiveLink(item.href, pathname),
  );

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t bg-background p-2 lg:hidden">
      <div className="flex items-center justify-around gap-1">
        {PORTAL_BOTTOM_PRIMARY.map((item) => {
          const Icon = item.icon;
          return (
            <Button
              key={item.href}
              variant={
                isPortalActiveLink(item.href, pathname) ? "secondary" : "ghost"
              }
              size="sm"
              className="h-auto flex-1 flex-col gap-1"
              asChild
            >
              <Link href={item.href}>
                <Icon />
                <span className="text-xs">{item.label}</span>
              </Link>
            </Button>
          );
        })}
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <Button
              variant={isMoreActive ? "secondary" : "ghost"}
              size="sm"
              className="h-auto flex-1 flex-col gap-1"
            >
              <Menu />
              <span className="text-xs">المزيد</span>
            </Button>
          </SheetTrigger>
          <SheetContent side="bottom" dir="rtl">
            <SheetHeader>
              <SheetTitle>المزيد</SheetTitle>
            </SheetHeader>
            <div className="grid grid-cols-2 gap-2">
              {PORTAL_MORE_ITEMS.map((item) => {
                const Icon = item.icon;
                return (
                  <Button
                    key={item.href}
                    variant={
                      isPortalActiveLink(item.href, pathname)
                        ? "secondary"
                        : "outline"
                    }
                    className="h-auto justify-start"
                    asChild
                  >
                    <Link href={item.href} onClick={() => setOpen(false)}>
                      <Icon />
                      {item.label}
                    </Link>
                  </Button>
                );
              })}
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </nav>
  );
}
