import { AppTopbar } from "@/components/app/app-topbar";
import { WorkspaceSidebar } from "@/components/app/workspace-sidebar";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider>
      <WorkspaceSidebar />
      <SidebarInset>
        <AppTopbar />
        <div className="flex min-w-0 flex-1 flex-col gap-5 p-4 md:p-6">
          {children}
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
