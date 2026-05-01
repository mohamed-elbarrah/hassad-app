"use client";

import { useAppSelector } from "@/lib/hooks";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { UserRole } from "@hassad/shared";
import { AppSidebar } from "@/components/app-sidebar";
import { Separator } from "@/components/ui/separator";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { NotificationBell } from "@/components/common/NotificationBell";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, isAuthenticated, isInitialized } = useAppSelector(
    (state) => state.auth,
  );
  const router = useRouter();
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);

  const roleHome: Record<UserRole, string> = {
    [UserRole.ADMIN]: "/dashboard/admin",
    [UserRole.PM]: "/dashboard/pm",
    [UserRole.SALES]: "/dashboard/sales",
    [UserRole.ACCOUNTANT]: "/dashboard/accountant",
    [UserRole.MARKETING]: "/dashboard/marketing",
    [UserRole.EMPLOYEE]: "/dashboard/employee",
    [UserRole.CLIENT]: "/portal",
  };

  const commonPrefixes = [
    "/dashboard/account",
    "/dashboard/notifications",
    "/dashboard/tasks",
    "/dashboard/finance",
  ];

  const rolePrefixes: Record<UserRole, string[]> = {
    [UserRole.ADMIN]: ["/dashboard"],
    [UserRole.PM]: ["/dashboard/pm"],
    [UserRole.SALES]: ["/dashboard/sales"],
    [UserRole.ACCOUNTANT]: ["/dashboard/accountant"],
    [UserRole.MARKETING]: ["/dashboard/marketing"],
    [UserRole.EMPLOYEE]: ["/dashboard/employee", "/dashboard/designer"],
    [UserRole.CLIENT]: ["/portal"],
  };

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted && isInitialized) {
      if (!isAuthenticated) {
        router.push("/login");
      } else if (user?.role === UserRole.CLIENT) {
        router.push("/portal");
      } else if (user && pathname) {
        if (user.role !== UserRole.ADMIN) {
          const allowedPrefixes = [
            ...commonPrefixes,
            ...(rolePrefixes[user.role] ?? []),
          ];

          const isDashboardRoot = pathname === "/dashboard";
          const isAllowed =
            isDashboardRoot ||
            allowedPrefixes.some((prefix) => pathname.startsWith(prefix));

          if (!isAllowed) {
            router.push(roleHome[user.role] ?? "/dashboard");
          }
        }
      }
    }
  }, [isAuthenticated, user, router, mounted, isInitialized, pathname]);

  if (!mounted || !isInitialized) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary mx-auto" />
          <p className="text-muted-foreground animate-pulse">جارٍ التهيئة...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated || user?.role === UserRole.CLIENT) {
    return null;
  }

  return (
    <SidebarProvider dir="rtl">
      <AppSidebar side="right" />

      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
          <SidebarTrigger className="-ms-1" />
          <Separator orientation="vertical" className="me-2 h-4" />
          <div className="flex-1" />
          <NotificationBell />
        </header>

        <main className="flex-1 p-6">{children}</main>
      </SidebarInset>
    </SidebarProvider>
  );
}
