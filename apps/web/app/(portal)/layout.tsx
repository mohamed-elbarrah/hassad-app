"use client";

import { useAppSelector } from "@/lib/hooks";
import { useRouter, usePathname } from "next/navigation";
import { useEffect, type CSSProperties } from "react";
import { LoaderCircle } from "lucide-react";
import { UserRole } from "@hassad/shared";
import {
  PortalHeader,
  PortalMobileNav,
  PortalSidebar,
} from "@/components/portal/shared/PortalNavigation";
import { SidebarProvider } from "@/components/ui/sidebar";
import { useNotificationSocket } from "@/hooks/useNotificationSocket";

export default function PortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, isAuthenticated, isInitialized } = useAppSelector(
    (state) => state.auth,
  );
  const router = useRouter();
  const pathname = usePathname();
  const isSetupPage = pathname === "/portal/profile/setup";

  useNotificationSocket();

  useEffect(() => {
    if (!isInitialized) return;

    if (!isAuthenticated) {
      router.replace("/login");
      return;
    }

    if (user?.role !== UserRole.CLIENT) {
      router.replace("/dashboard");
      return;
    }

    if (!user?.intakeCompleted && !isSetupPage) {
      router.replace("/portal/profile/setup");
    }
  }, [isInitialized, isAuthenticated, user, router, isSetupPage]);

  if (
    !isInitialized ||
    !isAuthenticated ||
    user?.role !== UserRole.CLIENT ||
    (!user?.intakeCompleted && !isSetupPage)
  ) {
    return (
      <div className="flex min-h-svh items-center justify-center" dir="rtl">
        <div className="flex flex-col items-center gap-3">
          <LoaderCircle className="animate-spin text-muted-foreground" />
          <p className="text-sm text-muted-foreground">جاري التحميل...</p>
        </div>
      </div>
    );
  }

  if (isSetupPage) {
    return <>{children}</>;
  }

  return (
    <SidebarProvider
      style={
        {
          "--sidebar-width": "20rem",
          "--sidebar-width-icon": "4.5rem",
        } as CSSProperties
      }
    >
      <div className="flex h-svh w-full overflow-hidden bg-muted/30" dir="rtl">
        <PortalSidebar />
        <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
          <PortalHeader />
          <main className="flex-1 overflow-y-auto p-4 pb-24 lg:p-6 lg:pb-6">
            {children}
          </main>
        </div>
        <PortalMobileNav />
      </div>
    </SidebarProvider>
  );
}
