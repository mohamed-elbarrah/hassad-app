import type { AuthSession } from "@/lib/auth/auth-types";
import { AppTopbar } from "@/components/app/app-topbar";
import { WorkspaceSidebar } from "@/components/app/workspace-sidebar";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";

export function AppShell({
  children,
  session,
}: {
  children: React.ReactNode;
  session: AuthSession;
}) {
  return (
    <SidebarProvider>
      <WorkspaceSidebar session={session} />
      <SidebarInset className="min-h-svh isolate overflow-x-clip">
        <AppTopbar session={session} />
        <div className="relative z-0 flex min-w-0 flex-1 flex-col gap-5 p-4 md:p-6">
          {children}
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
