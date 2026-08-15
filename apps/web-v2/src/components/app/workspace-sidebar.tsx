"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart3Icon,
  BriefcaseBusinessIcon,
  Building2Icon,
  CircleDollarSignIcon,
  ChevronRightIcon,
  ClipboardListIcon,
  LayoutDashboardIcon,
  LockKeyholeIcon,
  MegaphoneIcon,
  MessageSquareIcon,
  UsersIcon,
} from "lucide-react";

import type { WorkspaceDefinition } from "@/lib/auth/workspaces";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import {
  Sidebar,
  SidebarContent,
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

export function WorkspaceSidebar({
  workspace,
}: {
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
                  const hasChildren = Boolean(item.children?.length);
                  const isActive = hasChildren
                    ? item.children!.some(
                        (child) =>
                          pathname === child.href || pathname.startsWith(`${child.href}/`),
                      )
                    : pathname === item.href ||
                      (item.href !== workspace.home && pathname.startsWith(`${item.href}/`));

                  if (!hasChildren) {
                    return (
                      <SidebarMenuItem key={item.href}>
                        <SidebarMenuButton
                          className="min-h-10 group-data-[collapsible=icon]:min-h-8!"
                          isActive={isActive}
                          tooltip={item.label}
                          render={<Link href={item.href} />}
                        >
                          <Icon />
                          <span>{item.label}</span>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    );
                  }

                  return (
                    <Collapsible
                      key={item.href}
                      className="group/collapsible"
                      defaultOpen={isActive}
                    >
                      <SidebarMenuItem>
                        <SidebarMenuButton
                          className="min-h-10 group-data-[collapsible=icon]:min-h-8!"
                          isActive={isActive}
                          tooltip={item.label}
                          render={<CollapsibleTrigger />}
                        >
                          <Icon />
                          <span>{item.label}</span>
                          <ChevronRightIcon className="ml-auto transition-transform duration-200 group-data-[panel-open]/collapsible:rotate-90" />
                        </SidebarMenuButton>
                        <CollapsibleContent>
                          <SidebarMenuSub>
                            {item.children!.map((child) => {
                              const childIsActive =
                                pathname === child.href ||
                                pathname.startsWith(`${child.href}/`);

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
                        </CollapsibleContent>
                      </SidebarMenuItem>
                    </Collapsible>
                  );
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>
      <SidebarRail />
    </Sidebar>
  );
}
