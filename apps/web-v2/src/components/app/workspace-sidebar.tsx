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
import type { WorkspaceDefinition, WorkspaceNavigationItem } from "@/lib/auth/workspaces";
import { can } from "@/lib/permissions/permissions";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
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

function isAllowed(session: AuthSession, item: WorkspaceNavigationItem): boolean {
  if (!item.permission) {
    return true;
  }

  return can(session.permissions, item.permission);
}

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
        {workspace.groups.map((group) => (
          <SidebarGroup key={group.label}>
            <SidebarGroupLabel>{group.label}</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {group.items.map((item) => {
                  const Icon = iconMap[item.icon];
                  const allowed = isAllowed(session, item);
                  const isActive =
                    pathname === item.href || pathname.startsWith(`${item.href}/`);

                  return (
                    <SidebarMenuItem key={item.href}>
                      <SidebarMenuButton
                        isActive={isActive}
                        tooltip={item.label}
                        aria-disabled={!allowed}
                        render={allowed ? <Link href={item.href} /> : undefined}
                      >
                        <Icon />
                        <span>{item.label}</span>
                      </SidebarMenuButton>
                      {item.children && item.children.length > 0 ? (
                        <SidebarMenuSub>
                          {item.children.map((child) => {
                            const childAllowed =
                              !child.permission || can(session.permissions, child.permission);
                            const childIsActive =
                              pathname === child.href || pathname.startsWith(`${child.href}/`);

                            return (
                              <SidebarMenuSubItem key={child.href}>
                                <SidebarMenuSubButton
                                  isActive={childIsActive}
                                  aria-disabled={!childAllowed}
                                  render={childAllowed ? <Link href={child.href} /> : undefined}
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
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
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
