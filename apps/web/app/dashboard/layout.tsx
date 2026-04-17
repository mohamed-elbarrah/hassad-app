"use client";

import { useAppSelector } from "@/lib/hooks";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { UserRole } from "@hassad/shared";
import { AppSidebar } from "@/components/app-sidebar";
import { Separator } from "@/components/ui/separator";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, isAuthenticated, isInitialized } = useAppSelector(
    (state) => state.auth,
  );
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted && isInitialized) {
      if (!isAuthenticated) {
        router.push("/login");
      } else if (user?.role === UserRole.CLIENT) {
        router.push("/portal");
      }
    }
  }, [isAuthenticated, user, router, mounted, isInitialized]);

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
        </header>
        <main className="flex-1 min-w-0 p-6">{children}</main>
      </SidebarInset>
    </SidebarProvider>
  );
}
