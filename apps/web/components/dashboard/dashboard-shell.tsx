"use client";

import Image from "next/image";
import Link from "next/link";
import {
  useEffect,
  useMemo,
  useState,
  useSyncExternalStore,
  type CSSProperties,
  type ReactNode,
} from "react";
import { usePathname, useRouter } from "next/navigation";
import {
  Bell,
  ChevronDown,
  LogOut,
  Monitor,
  MoonStar,
  Settings,
  SunMedium,
} from "lucide-react";
import { useTheme } from "next-themes";
import { UserRole } from "@hassad/shared";

import {
  adminNavSections,
  roleNavSections,
  sharedNavSections,
  type NavItem,
  type NavSection,
} from "@/lib/navigation";
import {
  canAccessDashboardPath,
  getRoleHome,
  roleLabels,
} from "@/lib/dashboard-access";
import { useAppSelector } from "@/lib/hooks";
import { useAppDispatch } from "@/lib/hooks";
import { logout } from "@/features/auth/authSlice";
import { useLogoutMutation } from "@/features/auth/authApi";
import {
  useGetMyNotificationsQuery,
  useGetUnreadCountQuery,
} from "@/features/notifications/notificationsApi";
import type { NotificationItem } from "@/features/notifications/notificationsApi";
import { useDashboardNotificationSocket } from "@/hooks/useDashboardNotificationSocket";
import { formatRelativeTime } from "@/lib/format";
import { notificationPresentation } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarSeparator,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";

function isActiveLink(item: Pick<NavItem, "url" | "exact">, pathname: string) {
  if (item.exact) {
    return pathname === item.url;
  }

  return pathname === item.url || pathname.startsWith(`${item.url}/`);
}

function getActiveNavItem(items: NavItem[], pathname: string) {
  return items
    .filter((item) => isActiveLink(item, pathname))
    .sort((left, right) => right.url.length - left.url.length)[0];
}

function isExactPathActive(href: string, pathname: string) {
  return pathname === href;
}

const subscribeToHydration = () => () => {};
const getClientHydrationSnapshot = () => true;
const getServerHydrationSnapshot = () => false;

function useHydrated() {
  return useSyncExternalStore(
    subscribeToHydration,
    getClientHydrationSnapshot,
    getServerHydrationSnapshot,
  );
}

function getInitials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}

function DashboardNotificationsButton() {
  const { isAuthenticated } = useAppSelector((state) => state.auth);
  const { data } = useGetUnreadCountQuery(undefined, {
    skip: !isAuthenticated,
  });
  const {
    data: notificationsData,
    isLoading: notificationsLoading,
    isError: notificationsError,
    refetch: refetchNotifications,
  } = useGetMyNotificationsQuery(
    { page: 1, limit: 5 },
    { skip: !isAuthenticated },
  );

  const unreadCount = data?.count ?? 0;
  const notifications = (notificationsData?.data ??
    []) as unknown as NotificationItem[];
  const displayCount =
    unreadCount > 9 ? "9+" : unreadCount > 0 ? String(unreadCount) : null;

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative size-10 rounded-full border border-border bg-background hover:bg-accent"
          aria-label={
            displayCount
              ? `فتح الإشعارات، ${displayCount} غير مقروء`
              : "فتح الإشعارات"
          }
        >
          <Bell aria-hidden="true" data-icon="inline-start" />
          {displayCount ? (
            <Badge
              variant="destructive"
              className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full px-1"
            >
              {displayCount}
            </Badge>
          ) : null}
        </Button>
      </PopoverTrigger>
      <PopoverContent
        align="end"
        className="max-w-xs"
        dir="rtl"
        aria-label="قائمة الإشعارات"
      >
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-1">
            <p className="font-semibold text-foreground">الإشعارات</p>
            <p className="text-sm text-muted-foreground">
              {unreadCount
                ? `لديك ${unreadCount} إشعار غير مقروء`
                : "آخر الإشعارات والتحديثات"}
            </p>
          </div>

          {notificationsError ? (
            <Alert variant="destructive">
              <AlertTitle>تعذر تحميل الإشعارات</AlertTitle>
              <AlertDescription className="flex flex-col gap-3">
                حاول مرة أخرى لعرض آخر الإشعارات.
                <Button
                  variant="outline"
                  size="sm"
                  className="self-start"
                  onClick={() => refetchNotifications()}
                >
                  إعادة المحاولة
                </Button>
              </AlertDescription>
            </Alert>
          ) : null}

          {!notificationsError && (
            <div
              className="flex max-h-80 flex-col overflow-y-auto rounded-md border"
              aria-busy={notificationsLoading}
              aria-live="polite"
            >
              {notificationsLoading ? (
                <div className="flex flex-col gap-3 p-3">
                  {Array.from({ length: 3 }).map((_, index) => (
                    <div key={index} className="flex flex-col gap-2">
                      <Skeleton className="h-4 w-3/4" />
                      <Skeleton className="h-3 w-full" />
                    </div>
                  ))}
                </div>
              ) : notifications.length ? (
                notifications.map((notification) => {
                  const presentation = notificationPresentation(
                    notification.eventType,
                    notification.metadata,
                  );
                  return (
                    <Link
                      key={notification.id}
                      href="/dashboard/notifications"
                      className="flex items-start gap-2 border-b p-3 text-right last:border-b-0 hover:bg-muted/50 focus-visible:bg-muted/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring"
                    >
                      <span
                        aria-hidden="true"
                        className={`mt-2 size-2 shrink-0 rounded-full ${
                          notification.isRead ? "bg-transparent" : "bg-primary"
                        }`}
                      />
                      <span className="flex min-w-0 flex-1 flex-col gap-1">
                        <span
                          className={`truncate text-sm ${
                            notification.isRead
                              ? "text-foreground"
                              : "font-semibold text-foreground"
                          }`}
                        >
                          {presentation.title}
                        </span>
                        <span className="line-clamp-2 text-xs text-muted-foreground">
                          {presentation.body}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {formatRelativeTime(notification.createdAt as string)}
                        </span>
                      </span>
                    </Link>
                  );
                })
              ) : (
                <p className="p-4 text-center text-sm text-muted-foreground">
                  لا توجد إشعارات
                </p>
              )}
            </div>
          )}

          <Button asChild size="sm" className="w-full">
            <Link href="/dashboard/notifications">عرض جميع الإشعارات</Link>
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}

function DashboardThemeToggle() {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const mounted = useHydrated();

  if (!mounted) {
    return (
      <Button
        variant="ghost"
        size="icon"
        className="size-10 rounded-full border border-border bg-background"
        aria-label="تبديل المظهر"
      >
        <Monitor />
      </Button>
    );
  }

  const currentTheme = theme === "system" ? "system" : (resolvedTheme ?? theme);
  const ThemeIcon =
    currentTheme === "dark"
      ? MoonStar
      : currentTheme === "light"
        ? SunMedium
        : Monitor;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="size-10 rounded-full border border-border bg-background hover:bg-accent"
          aria-label="تبديل المظهر"
        >
          <ThemeIcon />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-40">
        <DropdownMenuItem onClick={() => setTheme("light")}>
          فاتح
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme("dark")}>
          داكن
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => setTheme("system")}>
          النظام
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function DashboardNavigation({
  sections,
  pathname,
  openSection,
  onSectionChange,
  onNavigate,
}: {
  sections: NavSection[];
  pathname: string;
  openSection: string | null;
  onSectionChange: (label: string, open: boolean) => void;
  onNavigate: () => void;
}) {
  const { state } = useSidebar();
  const isCollapsed = state === "collapsed";

  return (
    <div className="flex flex-col gap-2">
      {sections.map((section) => {
        const activeItem = getActiveNavItem(section.items, pathname);
        const SectionIcon = section.icon;

        if (section.items.length === 1) {
          const item = section.items[0];
          const active = activeItem?.url === item.url;

          return (
            <SidebarMenu key={section.label}>
              <SidebarMenuItem>
                <SidebarMenuButton
                  asChild
                  size="lg"
                  isActive={active}
                  tooltip={{ children: item.title, side: "left" }}
                  className="text-start group-data-[collapsible=icon]:!size-10 group-data-[collapsible=icon]:!p-0 group-data-[collapsible=icon]:justify-center"
                >
                  <Link
                    href={item.url}
                    aria-current={active ? "page" : undefined}
                    onClick={onNavigate}
                  >
                    <SectionIcon aria-hidden="true" />
                    <span className="group-data-[collapsible=icon]:hidden">
                      {item.title}
                    </span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          );
        }

        const isOpen = openSection === section.label;
        const sectionIsActive = Boolean(activeItem);
        const children = section.items.map((item) => {
          const active = activeItem?.url === item.url;

          return (
            <SidebarMenuItem key={item.url}>
              <SidebarMenuButton
                asChild
                size="lg"
                isActive={active}
                tooltip={{ children: item.title, side: "left" }}
                className="ps-10 text-start group-data-[collapsible=icon]:!size-10 group-data-[collapsible=icon]:!p-0 group-data-[collapsible=icon]:justify-center"
              >
                <Link
                  href={item.url}
                  aria-current={active ? "page" : undefined}
                  onClick={onNavigate}
                >
                  <span>{item.title}</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          );
        });

        if (isCollapsed) {
          return (
            <SidebarMenu key={section.label}>
              <SidebarMenuItem>
                <DropdownMenu dir="rtl">
                  <DropdownMenuTrigger asChild>
                    <SidebarMenuButton
                      size="lg"
                      isActive={sectionIsActive}
                      tooltip={{ children: section.label, side: "left" }}
                      aria-label={section.label}
                      className="group-data-[collapsible=icon]:!size-10 group-data-[collapsible=icon]:!p-0 group-data-[collapsible=icon]:justify-center"
                    >
                      <SectionIcon aria-hidden="true" />
                      <span className="group-data-[collapsible=icon]:hidden">
                        {section.label}
                      </span>
                    </SidebarMenuButton>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent
                    side="left"
                    align="start"
                    className="min-w-48"
                  >
                    <DropdownMenuLabel>{section.label}</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuGroup>
                      {section.items.map((item) => {
                        const active = activeItem?.url === item.url;
                        return (
                          <DropdownMenuItem
                            key={item.url}
                            asChild
                            className={cn(
                              active &&
                                "bg-accent font-medium text-accent-foreground",
                            )}
                          >
                            <Link
                              href={item.url}
                              aria-current={active ? "page" : undefined}
                              onClick={onNavigate}
                            >
                              {item.title}
                            </Link>
                          </DropdownMenuItem>
                        );
                      })}
                    </DropdownMenuGroup>
                  </DropdownMenuContent>
                </DropdownMenu>
              </SidebarMenuItem>
            </SidebarMenu>
          );
        }

        return (
          <Collapsible
            key={section.label}
            open={isOpen}
            onOpenChange={(open) => onSectionChange(section.label, open)}
            className="group/collapsible"
          >
            <SidebarGroup className="p-0">
              <SidebarMenu>
                <SidebarMenuItem>
                  <CollapsibleTrigger asChild>
                    <SidebarMenuButton
                      size="lg"
                      isActive={sectionIsActive}
                      tooltip={{ children: section.label, side: "left" }}
                      className="text-start group-data-[collapsible=icon]:!size-10 group-data-[collapsible=icon]:!p-0 group-data-[collapsible=icon]:justify-center"
                    >
                      <SectionIcon aria-hidden="true" />
                      <span className="group-data-[collapsible=icon]:hidden">
                        {section.label}
                      </span>
                      <ChevronDown
                        aria-hidden="true"
                        className="mr-auto transition-transform group-data-[state=open]/collapsible:rotate-180 group-data-[collapsible=icon]:hidden"
                      />
                    </SidebarMenuButton>
                  </CollapsibleTrigger>
                </SidebarMenuItem>
              </SidebarMenu>
              <CollapsibleContent>
                <SidebarGroupContent className="pt-1">
                  <SidebarMenu className="gap-1">{children}</SidebarMenu>
                </SidebarGroupContent>
              </CollapsibleContent>
            </SidebarGroup>
          </Collapsible>
        );
      })}
    </div>
  );
}

function DashboardSidebarContent() {
  const pathname = usePathname();
  const router = useRouter();
  const dispatch = useAppDispatch();
  const [logoutMutation] = useLogoutMutation();
  const { user } = useAppSelector((state) => state.auth);
  const { isMobile, setOpenMobile } = useSidebar();
  const isAdmin = user?.role === UserRole.ADMIN;

  const [openSectionOverride, setOpenSectionOverride] = useState<
    string | null | undefined
  >(undefined);

  const handleNavigation = () => {
    setOpenSectionOverride(undefined);
    if (isMobile) setOpenMobile(false);
  };

  const sections = useMemo(() => {
    if (!user) return [];

    const sourceSections = isAdmin
      ? [...adminNavSections, ...sharedNavSections]
      : [...roleNavSections, ...sharedNavSections];

    return sourceSections
      .map((section) => ({
        ...section,
        items: section.items.filter((item) => item.roles.includes(user.role)),
      }))
      .filter((section) => section.items.length > 0);
  }, [user, isAdmin]);

  const activeSection = useMemo(
    () =>
      sections.find((section) => getActiveNavItem(section.items, pathname)) ??
      null,
    [pathname, sections],
  );
  const openSection =
    openSectionOverride === undefined
      ? (activeSection?.label ?? null)
      : openSectionOverride;

  const settingsUrl =
    user?.role === UserRole.ADMIN
      ? "/dashboard/admin/settings"
      : "/dashboard/account";

  return (
    <Sidebar
      side="right"
      variant="inset"
      collapsible="icon"
      className="border-l border-sidebar-border"
    >
      <SidebarHeader className="border-b border-sidebar-border px-4 py-5 group-data-[collapsible=icon]:px-2">
        <Link
          href={user ? getRoleHome(user.role) : "/dashboard"}
          className="flex w-full items-center gap-3 rounded-xl px-1.5 py-1.5 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:px-0"
        >
          <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-sidebar-accent p-1">
            <Image
              src="/masar.svg"
              alt="Hassad"
              width={44}
              height={44}
              className="size-full object-contain"
            />
          </span>
          <div className="min-w-0 group-data-[collapsible=icon]:hidden">
            <p className="truncate text-sm font-semibold text-sidebar-foreground">
              Hassad Platform
            </p>
            <p className="truncate text-xs text-sidebar-foreground/70">
              {user ? roleLabels[user.role] : "Dashboard"}
            </p>
          </div>
        </Link>
      </SidebarHeader>

      <nav aria-label="التنقل الرئيسي" className="flex min-h-0 flex-1 flex-col">
        <SidebarContent className="px-3 py-4">
          <DashboardNavigation
            sections={sections}
            pathname={pathname}
            openSection={openSection}
            onSectionChange={(label, open) => {
              if (!open && activeSection?.label === label) return;
              setOpenSectionOverride(open ? label : null);
            }}
            onNavigate={handleNavigation}
          />
        </SidebarContent>
      </nav>

      <SidebarFooter className="border-t border-sidebar-border p-3">
        {user && (
          <div className="mb-3 flex items-center gap-3 rounded-xl border border-sidebar-border bg-sidebar-accent/40 p-3 group-data-[collapsible=icon]:hidden">
            <Avatar className="size-9">
              <AvatarImage src={user.avatarUrl ?? undefined} alt={user.name} />
              <AvatarFallback>{getInitials(user.name)}</AvatarFallback>
            </Avatar>
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-sidebar-foreground">
                {user.name}
              </p>
              <p className="truncate text-xs text-sidebar-foreground/70">
                {user.email}
              </p>
            </div>
          </div>
        )}

        <SidebarSeparator />

        <SidebarMenu className="gap-2 pt-2">
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              size="lg"
              isActive={isExactPathActive(settingsUrl, pathname)}
              className="group-data-[collapsible=icon]:!size-10 group-data-[collapsible=icon]:!p-0 group-data-[collapsible=icon]:justify-center"
              tooltip="الإعدادات"
            >
              <Link
                href={settingsUrl}
                aria-current={
                  isExactPathActive(settingsUrl, pathname) ? "page" : undefined
                }
                onClick={handleNavigation}
              >
                <Settings />
                <span>الإعدادات</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton
              size="lg"
              tooltip="تسجيل الخروج"
              className="text-destructive hover:text-destructive group-data-[collapsible=icon]:!size-10 group-data-[collapsible=icon]:!p-0 group-data-[collapsible=icon]:justify-center"
              onClick={async () => {
                if (!user) return;
                try {
                  await logoutMutation().unwrap();
                } catch {
                  // ignore
                }
                dispatch(logout());
                router.replace("/login");
              }}
            >
              <LogOut />
              <span>تسجيل الخروج</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}

export function DashboardShell({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const mounted = useHydrated();
  const { user, isAuthenticated, isInitialized } = useAppSelector(
    (state) => state.auth,
  );

  useDashboardNotificationSocket();

  useEffect(() => {
    if (!mounted || !isInitialized) return;

    if (!isAuthenticated) {
      router.replace("/login");
      return;
    }

    if (user?.role === UserRole.CLIENT) {
      router.replace("/portal");
      return;
    }

    if (user && pathname && !canAccessDashboardPath(user.role, pathname)) {
      router.replace(getRoleHome(user.role));
    }
  }, [isAuthenticated, isInitialized, mounted, pathname, router, user]);

  if (!mounted || !isInitialized) {
    return (
      <div className="flex min-h-svh items-center justify-center bg-background">
        <div className="space-y-4 text-center">
          <div className="mx-auto size-10 animate-spin rounded-full border-2 border-border border-t-primary" />
          <p className="text-sm text-muted-foreground">جارٍ التهيئة...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated || user?.role === UserRole.CLIENT) {
    return null;
  }

  return (
    <SidebarProvider
      defaultOpen
      dir="rtl"
      className="overflow-hidden"
      style={
        {
          "--sidebar-width": "20rem",
          "--sidebar-width-icon": "4.5rem",
        } as CSSProperties
      }
    >
      <DashboardSidebarContent />
      <SidebarInset>
        <div className="flex h-full min-h-0 flex-col overflow-hidden bg-background">
          <header className="z-20 shrink-0 flex h-16 items-center gap-3 border-b border-border bg-background/95 px-4 backdrop-blur supports-[backdrop-filter]:bg-background/80 lg:h-20 lg:px-6">
            <div className="flex min-w-0 flex-1 items-center gap-3">
              <SidebarTrigger className="shrink-0" />
              <div className="min-w-0">
                <p className="text-xs font-medium text-muted-foreground">
                  لوحة التحكم
                </p>
                <h1 className="truncate text-base font-semibold text-foreground">
                  {user ? `مرحبًا، ${user.name}` : "لوحة التحكم"}
                </h1>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <DashboardNotificationsButton />
              <DashboardThemeToggle />
              {/* {user && (
                <div className="hidden items-center gap-3 rounded-full border border-border bg-background px-3 py-2 sm:flex">
                  <Avatar className="h-8 w-8">
                    <AvatarImage
                      src={user.avatarUrl ?? undefined}
                      alt={user.name}
                    />
                    <AvatarFallback>{getInitials(user.name)}</AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 text-start">
                    <p className="truncate text-sm font-medium text-foreground">
                      {user.name}
                    </p>
                    <p className="truncate text-xs text-muted-foreground">
                      {roleLabels[user.role]}
                    </p>
                  </div>
                </div>
              )} */}
            </div>
          </header>

          <div className="flex-1 min-h-0 overflow-y-auto p-4 lg:p-6">
            {children}
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
