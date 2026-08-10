"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart3Icon,
  BriefcaseBusinessIcon,
  Building2Icon,
  CircleDollarSignIcon,
  ClipboardListIcon,
  LayoutDashboardIcon,
  LockKeyholeIcon,
  MegaphoneIcon,
  MessageSquareIcon,
  UsersIcon,
} from "lucide-react";

import type { AuthSession } from "@/lib/auth/auth-types";
import { getInitials } from "@/lib/auth/auth-utils";
import type { WorkspaceDefinition } from "@/lib/auth/workspaces";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarRail,
} from "@/components/ui/sidebar";

const iconMap = {
  overview: LayoutDashboardIcon,
  people: UsersIcon,
  clients: Building2Icon,
  commercial: BriefcaseBusinessIcon,
  delivery: ClipboardListIcon,
  finance: CircleDollarSignIcon,
  reports: BarChart3Icon,
  messages: MessageSquareIcon,
  campaigns: MegaphoneIcon,
  locked: LockKeyholeIcon,
};

export function WorkspaceSidebar({
  session,
  workspace,
}: {
  session: AuthSession;
  workspace: WorkspaceDefinition;
}) {
  const pathname = usePathname();

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" render={<Link href={workspace.home} />}>
              <LayoutDashboardIcon />
              <span className="flex min-w-0 flex-col items-start gap-0.5 text-left">
                <span className="truncate">Hassad</span>
                <span className="truncate text-xs text-muted-foreground">
                  {workspace.label}
                </span>
              </span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <SidebarMenu>
          {workspace.groups.flatMap((group) => group.items).map((item) => {
            const Icon = iconMap[item.icon];
            const isActive =
              pathname === item.href || pathname.startsWith(`${item.href}/`);

            return (
              <SidebarMenuItem key={item.href}>
                <SidebarMenuButton
                  isActive={isActive}
                  tooltip={item.label}
                  render={<Link href={item.href} />}
                >
                  <Icon />
                  <span>{item.label}</span>
                </SidebarMenuButton>
                {item.children && item.children.length > 0 ? (
                  <SidebarMenuSub>
                    {item.children.map((child) => {
                      const childIsActive =
                        pathname === child.href || pathname.startsWith(`${child.href}/`);

                      return (
                        <SidebarMenuSubItem key={child.href}>
                          <SidebarMenuSubButton
                            isActive={childIsActive}
                            render={<Link href={child.href} />}
                          >
                            <span>{child.label}</span>
                          </SidebarMenuSubButton>
                        </SidebarMenuSubItem>
                      );
                    })}
                  </SidebarMenuSub>
                ) : null}
              </SidebarMenuItem>
            );
          })}
        </SidebarMenu>
      </SidebarContent>
      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton tooltip={`Signed in as ${session.role.toLowerCase()}`}>
              <UsersIcon />
              <span>{session.name}</span>
              <span className="sr-only">{getInitials(session.name)}</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
