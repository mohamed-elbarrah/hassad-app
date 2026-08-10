import type { AuthSession } from "@/lib/auth/auth-types";
import type { WorkspaceDefinition } from "@/lib/auth/workspaces";
import { AccountMenu } from "@/components/app/account-menu";
import { AppBreadcrumbs } from "@/components/app/app-breadcrumbs";
import { CommandMenu } from "@/components/app/command-menu";
import { NotificationMenu } from "@/components/app/notification-menu";
import { ThemeToggle } from "@/components/app/theme-toggle";
import { SidebarTrigger } from "@/components/ui/sidebar";

export function AppTopbar({
  session,
  workspace,
}: {
  session: AuthSession;
  workspace: WorkspaceDefinition;
}) {
  return (
    <header className="sticky top-0 z-20 flex min-h-14 shrink-0 items-center justify-between gap-3 border-b bg-background/70 px-4 backdrop-blur-xl supports-backdrop-filter:bg-background/55 md:px-6">
      <div className="flex min-w-0 items-center gap-3">
        <SidebarTrigger />
        <AppBreadcrumbs />
      </div>
      <div className="flex items-center gap-2">
        <CommandMenu commands={workspace.commands} workspaceLabel={workspace.label} />
        <ThemeToggle />
        <NotificationMenu workspaceLabel={workspace.label} />
        <AccountMenu session={session} />
      </div>
    </header>
  );
}
