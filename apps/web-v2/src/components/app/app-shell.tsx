import type { ReactNode } from "react";

import type { AuthSession } from "@/lib/auth/auth-types";
import { resolveWorkspaceDefinition } from "@/lib/auth/workspaces";
import { AppTopbar } from "@/components/app/app-topbar";
import { WorkspaceSidebar } from "@/components/app/workspace-sidebar";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";

export function AppShell({
  children,
  session,
}: {
  children: ReactNode;
  session: AuthSession;
}) {
  const workspace = resolveWorkspaceDefinition(session.role);

  return (
    <SidebarProvider>
      <WorkspaceSidebar workspace={workspace} />
      <SidebarInset className="min-h-svh isolate overflow-x-clip">
        <AppTopbar session={session} workspace={workspace} />
        <div className="relative z-0 flex min-w-0 flex-1 flex-col gap-5 p-4 md:p-6">
          {children}
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
