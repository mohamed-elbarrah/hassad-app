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
  MessageSquareIcon,
  UsersIcon,
} from "lucide-react";

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
import { currentUser, workspaceNavigation } from "@/lib/fixtures/first-slice";
import { can } from "@/lib/permissions/permissions";

const iconMap = {
  overview: LayoutDashboardIcon,
  people: UsersIcon,
  clients: Building2Icon,
  commercial: BriefcaseBusinessIcon,
  delivery: ClipboardListIcon,
  finance: CircleDollarSignIcon,
  reports: BarChart3Icon,
  messages: MessageSquareIcon,
  locked: LockKeyholeIcon,
};

export function WorkspaceSidebar() {
  const pathname = usePathname();

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" render={<Link href="/admin" />}>
              <LayoutDashboardIcon />
              <span>Hassad</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        {workspaceNavigation.map((group) => (
          <SidebarGroup key={group.label}>
            <SidebarGroupLabel>{group.label}</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {group.items.map((item) => {
                  const Icon = iconMap[item.icon];
                  const allowed = can(currentUser.permissions, item.permission);
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
                            const childAllowed = can(
                              currentUser.permissions,
                              child.permission
                            );
                            const childIsActive =
                              pathname === child.href ||
                              pathname.startsWith(`${child.href}/`);

                            return (
                              <SidebarMenuSubItem key={child.href}>
                                <SidebarMenuSubButton
                                  isActive={childIsActive}
                                  aria-disabled={!childAllowed}
                                  render={
                                    childAllowed ? <Link href={child.href} /> : undefined
                                  }
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
            <SidebarMenuButton tooltip="Signed in as administrator">
              <UsersIcon />
              <span>{currentUser.name}</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
