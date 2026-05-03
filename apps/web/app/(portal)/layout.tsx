"use client";

import { useAppSelector } from "@/lib/hooks";
import { useRouter } from "next/navigation";
import { useEffect, useState, useCallback } from "react";
import { UserRole } from "@hassad/shared";
import { PortalSidebar } from "@/components/portal/PortalSidebar";
import { PortalHeader } from "@/components/portal/PortalHeader";
import { BottomNav } from "@/components/portal/BottomNav";
import { IntakeFormModal } from "@/components/dashboard/crm/IntakeFormModal";

// ─── localStorage key helper ──────────────────────────────────────────────────
function intakeStorageKey(userId: string) {
  return `intake_done_${userId}`;
}

// ─── Layout ───────────────────────────────────────────────────────────────────
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
  const [showIntakeForm, setShowIntakeForm] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Auth guard
  useEffect(() => {
    if (mounted && isInitialized) {
      if (!isAuthenticated) {
        router.push("/login");
      } else if (user?.role !== UserRole.CLIENT) {
        router.push("/dashboard");
      }
    }
  }, [isAuthenticated, user, router, mounted, isInitialized]);

  // First-login intake gate:
  useEffect(() => {
    if (!mounted || !isInitialized || !isAuthenticated) return;
    if (user?.role !== UserRole.CLIENT || !user?.id) return;

    const alreadyDone = localStorage.getItem(intakeStorageKey(user.id));
    if (!alreadyDone) {
      setShowIntakeForm(true);
    }
  }, [mounted, isInitialized, isAuthenticated, user]);

  const handleIntakeSuccess = useCallback(() => {
    if (user?.id) {
      localStorage.setItem(intakeStorageKey(user.id), "true");
    }
    setShowIntakeForm(false);
  }, [user]);

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
    <div className="h-screen overflow-hidden flex w-full" dir="rtl" style={{ background: "#F9FAFB" }}>
      {/* Right Sidebar — desktop only (lg = 1024px+) */}
      <div className="hidden lg:block">
        <PortalSidebar />
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        <PortalHeader />
        {/* Bottom padding on mobile/tablet to make room for bottom nav */}
        <main className="flex-1 overflow-y-auto p-4 lg:p-5 pb-20 lg:pb-5">
          {children}
        </main>
      </div>

      {/* Bottom Navigation — mobile + tablet only */}
      <BottomNav />

      {/* First-login mandatory intake form */}
      {showIntakeForm && (
        <IntakeFormModal mandatory onSuccess={handleIntakeSuccess} />
      )}
    </div>
  );
}
