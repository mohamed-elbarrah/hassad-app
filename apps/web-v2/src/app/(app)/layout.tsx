import type { ReactNode } from "react";

import { AuthSessionBoundary } from "@/components/app/auth-session-boundary";
import { AppShell } from "@/components/app/app-shell";
import { requireServerSession } from "@/lib/auth/server-session";

export default async function AuthenticatedLayout({
  children,
}: {
  children: ReactNode;
}) {
  const session = await requireServerSession();

  return (
    <AuthSessionBoundary session={session}>
      <AppShell session={session}>{children}</AppShell>
    </AuthSessionBoundary>
  );
}
