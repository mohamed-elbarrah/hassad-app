"use client";

import { useAppSelector } from "@/lib/hooks";
import { useRouter, usePathname } from "next/navigation";
import { useEffect } from "react";
import { UserRole } from "@hassad/shared";
import { Sidebar } from "@/components/design-system/Sidebar";
import { AppHeader } from "@/components/design-system/AppHeader";
import { BottomNav } from "@/components/design-system/BottomNav";
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
      <div className="flex items-center justify-center min-h-screen" dir="rtl">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary mx-auto" />
          <p className="text-muted-foreground animate-pulse">
            جاري التحميل...
          </p>
        </div>
      </div>
    );
  }

  if (isSetupPage) {
    return <>{children}</>;
  }

  return (
    <div
      className="h-screen overflow-hidden flex w-full"
      dir="rtl"
      style={{ background: "#F9FAFB" }}
    >
      <div className="hidden lg:block">
        <Sidebar />
      </div>

      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        <AppHeader />
        <main className="flex-1 overflow-y-auto p-4 lg:p-5 pb-20 lg:pb-5">
          {children}
        </main>
      </div>

      <BottomNav />
    </div>
  );
}
