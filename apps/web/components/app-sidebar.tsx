"use client";

import {
  Users,
  FolderKanban,
  ReceiptText,
  Settings,
  LayoutDashboard,
} from "lucide-react";

import { NavMain } from "@/components/nav-main";
import { NavUser } from "@/components/nav-user";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar";
import { useAppSelector } from "@/lib/hooks";

/** Navigation tree for the internal dashboard. Phase labels indicate readiness. */
const navItems = [
  {
    title: "لوحة التحكم",
    url: "/dashboard",
    icon: LayoutDashboard,
    isActive: false,
    items: [],
  },
  {
    title: "إدارة العملاء",
    url: "/dashboard/crm/clients",
    icon: Users,
    isActive: true,
    items: [{ title: "قائمة العملاء", url: "/dashboard/crm/clients" }],
  },
  {
    title: "المشاريع",
    url: "#",
    icon: FolderKanban,
    isActive: false,
    items: [{ title: "قريباً — المرحلة 3", url: "#" }],
  },
  {
    title: "المالية",
    url: "#",
    icon: ReceiptText,
    isActive: false,
    items: [{ title: "قريباً — المرحلة 5", url: "#" }],
  },
  {
    title: "الإعدادات",
    url: "/dashboard/settings",
    icon: Settings,
    isActive: false,
    items: [],
  },
];

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const user = useAppSelector((state) => state.auth.user);

  const sidebarUser = {
    name: user?.name ?? "—",
    email: user?.email ?? "—",
    avatar: "",
  };

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <a href="/dashboard">
                <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground text-sm font-bold">
                  ح
                </div>
                <div className="grid flex-1 text-start text-sm leading-tight">
                  <span className="truncate font-semibold">Hassad</span>
                  <span className="truncate text-xs text-muted-foreground">
                    منصة التسويق
                  </span>
                </div>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        <NavMain items={navItems} />
      </SidebarContent>

      <SidebarFooter>
        <NavUser user={sidebarUser} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
