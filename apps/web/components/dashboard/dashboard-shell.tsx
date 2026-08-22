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
import { useGetUnreadCountQuery } from "@/features/notifications/notificationsApi";
import { useDashboardNotificationSocket } from "@/hooks/useDashboardNotificationSocket";
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
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
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

  const unreadCount = data?.count ?? 0;
  const displayCount =
    unreadCount > 9 ? "9+" : unreadCount > 0 ? String(unreadCount) : null;

  return (
    <Button
      asChild
      variant="ghost"
      size="icon"
      className="relative h-10 w-10 rounded-full border border-border bg-background hover:bg-accent"
    >
      <Link href="/dashboard/notifications" aria-label="الإشعارات">
        <Bell className="h-5 w-5" />
        {displayCount ? (
          <Badge
            variant="destructive"
            className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full px-1 text-[10px]"
          >
            {displayCount}
          </Badge>
        ) : null}
      </Link>
    </Button>
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
        className="h-10 w-10 rounded-full border border-border bg-background"
        aria-label="تبديل المظهر"
      >
        <Monitor className="h-5 w-5" />
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
          className="h-10 w-10 rounded-full border border-border bg-background hover:bg-accent"
          aria-label="تبديل المظهر"
        >
          <ThemeIcon className="h-5 w-5" />
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
        label: section.label,
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
      <SidebarHeader className="border-b border-sidebar-border px-3 py-4">
        <Link
          href={user ? getRoleHome(user.role) : "/dashboard"}
          className="flex items-center gap-3 rounded-xl px-2 py-1.5"
        >
          <Image src="/masar.svg" alt="Hassad" width={40} height={40} />
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
        <SidebarContent className="px-2 py-3">
          {isAdmin ? (
            sections.map((section) => {
              if (section.items.length === 1) {
                const item = section.items[0];
                const Icon = item.icon;
                const active =
                  getActiveNavItem(section.items, pathname)?.url === item.url;

                return (
                  <SidebarGroup key={section.label}>
                    <SidebarGroupLabel>{section.label}</SidebarGroupLabel>
                    <SidebarGroupContent>
                      <SidebarMenu>
                        <SidebarMenuItem>
                          <SidebarMenuButton
                            asChild
                            isActive={active}
                            tooltip={item.title}
                          >
                            <Link
                              href={item.url}
                              aria-current={active ? "page" : undefined}
                              onClick={handleNavigation}
                            >
                              <Icon />
                              <span>{item.title}</span>
                            </Link>
                          </SidebarMenuButton>
                        </SidebarMenuItem>
                      </SidebarMenu>
                    </SidebarGroupContent>
                  </SidebarGroup>
                );
              }

              const isOpen = openSection === section.label;
              const activeUrl = getActiveNavItem(section.items, pathname)?.url;

              return (
                <Collapsible
                  key={section.label}
                  open={isOpen}
                  onOpenChange={(open) => {
                    if (!open && activeSection?.label === section.label) return;
                    setOpenSectionOverride(open ? section.label : null);
                  }}
                  className="group/collapsible"
                >
                  <SidebarGroup>
                    <SidebarGroupLabel asChild>
                      <CollapsibleTrigger className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-xs font-medium text-sidebar-foreground/70 transition-colors hover:text-sidebar-foreground">
                        <span>{section.label}</span>
                        <ChevronDown className="mr-auto h-4 w-4 transition-transform group-data-[state=open]/collapsible:rotate-180" />
                      </CollapsibleTrigger>
                    </SidebarGroupLabel>

                    <CollapsibleContent>
                      <SidebarGroupContent className="pt-1">
                        <SidebarMenu>
                          {section.items.map((item) => {
                            const Icon = item.icon;
                            const active = activeUrl === item.url;

                            return (
                              <SidebarMenuItem key={item.url}>
                                <SidebarMenuButton
                                  asChild
                                  isActive={active}
                                  tooltip={item.title}
                                >
                                  <Link
                                    href={item.url}
                                    aria-current={active ? "page" : undefined}
                                    onClick={handleNavigation}
                                  >
                                    <Icon />
                                    <span>{item.title}</span>
                                  </Link>
                                </SidebarMenuButton>
                              </SidebarMenuItem>
                            );
                          })}
                        </SidebarMenu>
                      </SidebarGroupContent>
                    </CollapsibleContent>
                  </SidebarGroup>
                </Collapsible>
              );
            })
          ) : (
            <SidebarMenu>
              {sections
                .flatMap((section) => section.items)
                .map((item) => {
                  const Icon = item.icon;
                  const active = isActiveLink(item, pathname);

                  return (
                    <SidebarMenuItem key={item.url}>
                      <SidebarMenuButton
                        asChild
                        isActive={active}
                        tooltip={item.title}
                      >
                        <Link
                          href={item.url}
                          aria-current={active ? "page" : undefined}
                          onClick={handleNavigation}
                        >
                          <Icon />
                          <span>{item.title}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })}
            </SidebarMenu>
          )}
        </SidebarContent>
      </nav>

      <SidebarFooter className="border-t border-sidebar-border p-3">
        {user && (
          <div className="mb-3 flex items-center gap-3 rounded-xl border border-sidebar-border bg-sidebar-accent/40 p-3 group-data-[collapsible=icon]:hidden">
            <Avatar className="h-9 w-9">
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

        <SidebarMenu className="pt-2">
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              isActive={isExactPathActive(settingsUrl, pathname)}
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
              tooltip="تسجيل الخروج"
              className="text-destructive hover:text-destructive"
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
          <div className="mx-auto h-10 w-10 animate-spin rounded-full border-2 border-border border-t-primary" />
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
          "--sidebar-width": "18rem",
          "--sidebar-width-icon": "3.25rem",
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
