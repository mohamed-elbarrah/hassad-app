import type { WorkspaceDefinition } from "@/lib/auth/workspaces";
import { AppBreadcrumbs } from "@/components/app/app-breadcrumbs";
import { NotificationMenu } from "@/components/app/notification-menu";
import { ThemeToggle } from "@/components/app/theme-toggle";
import { LanguageSwitcher } from "@/components/app/language-switcher";
import { SidebarTrigger } from "@/components/ui/sidebar";

export function AppTopbar({
  workspace,
}: {
  workspace: WorkspaceDefinition;
}) {
  return (
    <header className="sticky top-0 z-20 flex min-h-14 shrink-0 items-center justify-between gap-3 border-b bg-background/70 px-4 backdrop-blur-xl supports-backdrop-filter:bg-background/55 md:px-6">
      <div className="flex min-w-0 items-center gap-3">
        <SidebarTrigger />
        <AppBreadcrumbs />
      </div>
      <div className="flex items-center gap-2">
        <LanguageSwitcher />
        <ThemeToggle />
        <NotificationMenu workspaceKey={workspace.key} workspaceLabel={workspace.label} />
      </div>
    </header>
  );
}
