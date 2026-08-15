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

import type { AuthSession } from "@/lib/auth/auth-types";
import type { WorkspaceDefinition } from "@/lib/auth/workspaces";
import { AccountMenu } from "@/components/app/account-menu";
import { useLocale } from "@/components/app/locale-provider";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarFooter,
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
  const { locale } = useLocale();

  return (
    <Sidebar
      side={locale === "ar" ? "right" : "left"}
      dir={locale === "ar" ? "rtl" : "ltr"}
      collapsible="icon"
    >
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              size="lg"
              aria-label="Hassad home"
              render={<Link href={workspace.home} />}
            >
              <LayoutDashboardIcon aria-hidden="true" />
              <span className="truncate group-data-[collapsible=icon]:hidden">Hassad</span>
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
                          <ChevronRightIcon className="ms-auto transition-transform duration-200 group-data-[panel-open]/collapsible:rotate-90 rtl:rotate-180 rtl:group-data-[panel-open]/collapsible:rotate-90" />
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
      <SidebarFooter>
        <AccountMenu session={session} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
