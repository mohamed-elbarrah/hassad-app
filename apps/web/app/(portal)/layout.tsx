"use client";

import { useAppSelector } from "@/lib/hooks";
import { useRouter, usePathname } from "next/navigation";
import { useEffect, type CSSProperties } from "react";
import { LoaderCircle } from "lucide-react";
import { UserRole } from "@hassad/shared";
import {
  PortalHeader,
  PortalSidebar,
} from "@/components/portal/shared/PortalNavigation";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
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
      <PortalSidebar />
      <SidebarInset>
        <div className="flex h-full min-h-0 flex-col overflow-hidden bg-background">
          <PortalHeader />
          <div className="flex-1 min-h-0 overflow-y-auto p-4 lg:p-6">
            {children}
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
