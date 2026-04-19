"use client";

import { useAppSelector } from "@/lib/hooks";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { UserRole } from "@hassad/shared";
import { NavUser } from "@/components/nav-user";
import { SidebarProvider } from "@/components/ui/sidebar";

export default function PortalLayout({
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
      } else if (user?.role !== UserRole.CLIENT) {
        router.push("/dashboard");
      }
    }
  }, [isAuthenticated, user, router, mounted, isInitialized]);

  if (!mounted || !isInitialized) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary mx-auto"></div>
          <p className="text-muted-foreground animate-pulse">
            Initializing Portal...
          </p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated || user?.role !== UserRole.CLIENT) {
    return null;
  }

  return (
    <SidebarProvider>
      <div className="min-h-screen bg-white flex flex-col w-full">
        <header className="bg-blue-600 text-white p-4 shadow-md flex items-center justify-between">
          <span className="font-semibold text-lg">بوابة العميل</span>
          {/* NavUser requires sidebar context — renders user dropdown */}
          <div className="[&_button]:text-white [&_button]:bg-transparent [&_button:hover]:bg-white/10">
            <NavUser />
          </div>
        </header>
        <main className="flex-1 p-6">{children}</main>
      </div>
    </SidebarProvider>
  );
}
