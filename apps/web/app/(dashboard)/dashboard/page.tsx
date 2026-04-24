"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAppSelector } from "@/lib/hooks";
import { UserRole } from "@hassad/shared";

export default function DashboardPage() {
  const router = useRouter();
  const { user, isAuthenticated, isInitialized } = useAppSelector(
    (state) => state.auth,
  );

  useEffect(() => {
    if (!isInitialized) return;

    if (!isAuthenticated || !user) {
      router.replace("/login");
      return;
    }

    // Direct mapping to the new valid paths
    const roleRoutes: Record<UserRole, string> = {
      [UserRole.ADMIN]: "/dashboard/admin",
      [UserRole.PM]: "/dashboard/pm",
      [UserRole.SALES]: "/dashboard/sales",
      [UserRole.ACCOUNTANT]: "/dashboard/accountant",
      [UserRole.MARKETING]: "/dashboard/marketing",
      [UserRole.EMPLOYEE]: "/dashboard/employee",
      [UserRole.CLIENT]: "/portal", // Clients go to (portal)
    };

    const targetPath = roleRoutes[user.role as UserRole];
    if (targetPath) {
      router.replace(targetPath);
    } else {
      router.replace("/");
    }
  }, [user, isAuthenticated, isInitialized, router]);

  return (
    <div className="flex h-[50vh] items-center justify-center">
      <div className="flex flex-col items-center space-y-4">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        <p className="text-sm text-muted-foreground">
          Loading your workspace...
        </p>
      </div>
    </div>
  );
}
