"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState, type CSSProperties, type ReactNode } from "react";
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

import { adminNavSections, roleNavSections } from "@/lib/navigation";
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
} from "@/components/ui/sidebar";

const roleHome: Record<UserRole, string> = {
  [UserRole.ADMIN]: "/dashboard/admin",
  [UserRole.PM]: "/dashboard/pm",
  [UserRole.SALES]: "/dashboard/sales",
  [UserRole.ACCOUNTANT]: "/dashboard/finance",
  [UserRole.MARKETING]: "/dashboard/marketing",
  [UserRole.TEAM]: "/dashboard/team",
  [UserRole.CLIENT]: "/portal",
};

const roleLabels: Record<UserRole, string> = {
  [UserRole.ADMIN]: "الإدارة",
  [UserRole.PM]: "إدارة المشاريع",
  [UserRole.SALES]: "المبيعات",
  [UserRole.ACCOUNTANT]: "المالية",
  [UserRole.MARKETING]: "التسويق",
  [UserRole.TEAM]: "الفريق",
  [UserRole.CLIENT]: "العميل",
};

const rolePrefixes: Record<UserRole, string[]> = {
  [UserRole.ADMIN]: ["/dashboard/admin"],
  [UserRole.PM]: ["/dashboard/pm"],
  [UserRole.SALES]: ["/dashboard/sales"],
  [UserRole.ACCOUNTANT]: ["/dashboard/finance"],
  [UserRole.MARKETING]: ["/dashboard/marketing"],
  [UserRole.TEAM]: ["/dashboard/team", "/dashboard/designer"],
  [UserRole.CLIENT]: ["/portal"],
};

const commonPrefixes = [
  "/dashboard/account",
  "/dashboard/notifications",
  "/dashboard/messages",
  "/dashboard/tasks",
  "/dashboard/finance",
];

const exactActivePaths = new Set([
  "/dashboard",
  "/dashboard/admin",
  "/dashboard/pm",
  "/dashboard/sales",
  "/dashboard/finance",
  "/dashboard/marketing",
  "/dashboard/team",
]);

function isActiveLink(href: string, pathname: string) {
  if (exactActivePaths.has(href)) {
    return pathname === href;
  }

  return pathname === href || pathname.startsWith(`${href}/`);
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
  const displayCount = unreadCount > 9 ? "9+" : unreadCount > 0 ? String(unreadCount) : null;

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
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

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

  const currentTheme = theme === "system" ? "system" : resolvedTheme ?? theme;
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
        <DropdownMenuItem onClick={() => setTheme("light")}>فاتح</DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme("dark")}>داكن</DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => setTheme("system")}>النظام</DropdownMenuItem>
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

  const sections = useMemo(() => {
    if (!user) return [];

    const sourceSections =
      user.role === UserRole.ADMIN ? adminNavSections : roleNavSections;

    return sourceSections
      .map((section) => ({
        label: section.label,
        items: section.items.filter((item) => item.roles.includes(user.role)),
      }))
      .filter((section) => section.items.length > 0);
  }, [user]);

  const [openSection, setOpenSection] = useState<string | null>(null);

  useEffect(() => {
    const activeSection = sections.find((section) =>
      section.items.some((item) => isActiveLink(item.url, pathname)),
    );

    if (activeSection) {
      setOpenSection(activeSection.label);
    }
  }, [pathname, sections]);

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
          href={user ? roleHome[user.role] : "/dashboard"}
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

      <SidebarContent className="px-2 py-3">
        {sections.map((section) => {
          if (section.items.length === 1) {
            const item = section.items[0];
            const Icon = item.icon;
            const active = isActiveLink(item.url, pathname);

            return (
              <SidebarGroup key={section.label}>
                <SidebarGroupLabel>{section.label}</SidebarGroupLabel>
                <SidebarGroupContent>
                  <SidebarMenu>
                    <SidebarMenuItem>
                      <SidebarMenuButton asChild isActive={active} tooltip={item.title}>
                        <Link href={item.url}>
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

          return (
            <Collapsible
              key={section.label}
              open={isOpen}
              onOpenChange={(open) => {
                setOpenSection(open ? section.label : null);
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
                        const active = isActiveLink(item.url, pathname);

                        return (
                          <SidebarMenuItem key={item.url}>
                            <SidebarMenuButton
                              asChild
                              isActive={active}
                              tooltip={item.title}
                            >
                              <Link href={item.url}>
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
        })}
      </SidebarContent>

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
            <SidebarMenuButton asChild isActive={isActiveLink(settingsUrl, pathname)}>
              <Link href={settingsUrl}>
                <Settings />
                <span>الإعدادات</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton
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

export function DashboardShell({
  children,
}: {
  children: ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);
  const { user, isAuthenticated, isInitialized } = useAppSelector(
    (state) => state.auth,
  );

  useDashboardNotificationSocket();

  useEffect(() => {
    setMounted(true);
  }, []);

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

    if (user && pathname && user.role !== UserRole.ADMIN) {
      const allowedPrefixes = [
        ...commonPrefixes,
        ...(rolePrefixes[user.role] ?? []),
      ];

      const isDashboardRoot = pathname === "/dashboard";
      const isAllowed =
        isDashboardRoot ||
        allowedPrefixes.some((prefix) => pathname.startsWith(prefix));

      if (!isAllowed) {
        router.replace(roleHome[user.role] ?? "/dashboard");
      }
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
      style={{
        "--sidebar-width": "18rem",
        "--sidebar-width-icon": "3.25rem",
      } as CSSProperties}
    >
      <DashboardSidebarContent />
      <SidebarInset>
        <div className="flex min-h-svh flex-col bg-background">
          <header className="sticky top-0 z-20 flex h-16 items-center gap-3 border-b border-border bg-background/95 px-4 backdrop-blur supports-[backdrop-filter]:bg-background/80 lg:h-20 lg:px-6">
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

          <main className="flex-1 overflow-y-auto p-4 lg:p-6">{children}</main>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
