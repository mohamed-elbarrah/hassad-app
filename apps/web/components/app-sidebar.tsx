"use client";

import * as React from "react";
import Link from "next/link";
import {
  Home,
  Users,
  Briefcase,
  Calculator,
  Megaphone,
  Kanban,
  ClipboardList,
} from "lucide-react";

import { useAppSelector } from "@/lib/hooks";

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";

// Conditional navigation items based on UserRole
const allNavItems = [
  {
    title: "Admin Dashboard",
    url: "/dashboard/admin",
    icon: Home,
    roles: ["ADMIN"],
  },
  {
    title: "Project Management",
    url: "/dashboard/pm/projects",
    icon: Briefcase,
    roles: ["ADMIN", "PM"],
  },
  {
    title: "Sales & CRM",
    url: "/dashboard/sales/pipeline",
    icon: Users,
    roles: ["ADMIN", "SALES"],
  },
  {
    title: "Financials",
    url: "/dashboard/accountant",
    icon: Calculator,
    roles: ["ADMIN", "ACCOUNTANT"],
  },
  {
    title: "Marketing Campaigns",
    url: "/dashboard/marketing",
    icon: Megaphone,
    roles: ["ADMIN", "MARKETING"],
  },
  {
    title: "لوحتي",
    url: "/dashboard/employee",
    icon: ClipboardList,
    roles: ["EMPLOYEE"],
  },
  {
    title: "الموظفون",
    url: "/dashboard/admin/employees",
    icon: Users,
    roles: ["ADMIN"],
  },
];

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { user } = useAppSelector((state) => state.auth);

  const navItems = allNavItems.filter((item) => {
    if (!user) return false;
    return item.roles.includes(user.role);
  });

  return (
    <Sidebar side="right" variant="inset" collapsible="icon" {...props}>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Menu</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <Link href={item.url}>
                      <item.icon />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
