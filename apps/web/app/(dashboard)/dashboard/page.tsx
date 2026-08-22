"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAppSelector } from "@/lib/hooks";
import { getPostLoginPath } from "@/lib/dashboard-access";

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

    router.replace(getPostLoginPath(user));
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
