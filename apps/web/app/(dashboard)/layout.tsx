"use client";

import { useAppSelector } from "@/lib/hooks";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { UserRole } from "@hassad/shared";
import { DashboardSidebar } from "@/components/design-system/DashboardSidebar";
import { DashboardAppHeader } from "@/components/design-system/DashboardAppHeader";
import { useDashboardNotificationSocket } from "@/hooks/useDashboardNotificationSocket";

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
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  // Setup WebSocket for real-time notifications
  useDashboardNotificationSocket();

  const roleHome: Record<UserRole, string> = {
    [UserRole.ADMIN]: "/dashboard/admin",
    [UserRole.PM]: "/dashboard/pm",
    [UserRole.SALES]: "/dashboard/sales",
    [UserRole.ACCOUNTANT]: "/dashboard/finance",
    [UserRole.MARKETING]: "/dashboard/marketing",
    [UserRole.TEAM]: "/dashboard/team",
    [UserRole.CLIENT]: "/portal",
  };

  const commonPrefixes = [
    "/dashboard/account",
    "/dashboard/notifications",
    "/dashboard/messages",
    "/dashboard/tasks",
    "/dashboard/finance",
  ];

  const rolePrefixes: Record<UserRole, string[]> = {
    [UserRole.ADMIN]: ["/dashboard/admin"],
    [UserRole.PM]: ["/dashboard/pm"],
    [UserRole.SALES]: ["/dashboard/sales"],
    [UserRole.ACCOUNTANT]: ["/dashboard/finance"],
    [UserRole.MARKETING]: ["/dashboard/marketing"],
    [UserRole.TEAM]: ["/dashboard/team", "/dashboard/designer"],
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
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-secondary-500 mx-auto" />
          <p className="text-neutral-300 animate-pulse">جارٍ التهيئة...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated || user?.role === UserRole.CLIENT) {
    return null;
  }

  return (
    <div
      className="flex h-screen w-full overflow-hidden bg-surface-muted"
      dir="rtl"
    >
      {/* Desktop sidebar */}
      <div className="hidden lg:block">
        <DashboardSidebar />
      </div>

      {/* Mobile sidebar overlay */}
      {mobileSidebarOpen && (
        <>
          <div
            className="fixed inset-0 bg-black/30 z-40 lg:hidden"
            onClick={() => setMobileSidebarOpen(false)}
          />
          <div className="fixed right-0 top-0 h-screen z-50 lg:hidden">
            <DashboardSidebar />
          </div>
        </>
      )}

      {/* Main content area */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        <DashboardAppHeader
          onMenuToggle={() => setMobileSidebarOpen((v) => !v)}
        />

        <main className="flex-1 overflow-y-auto p-4 lg:p-5">{children}</main>
      </div>
    </div>
  );
}
