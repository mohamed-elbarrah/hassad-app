"use client"

import * as React from "react"
import { Home, Users, Briefcase, Calculator, Megaphone, Paintbrush } from "lucide-react"

import { useAppSelector } from "@/lib/hooks"

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar"

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
    url: "/dashboard/pm",
    icon: Briefcase,
    roles: ["ADMIN", "PM"],
  },
  {
    title: "Sales & CRM",
    url: "/dashboard/sales",
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
    title: "Design Workspace",
    url: "/dashboard/designer",
    icon: Paintbrush,
    roles: ["ADMIN", "EMPLOYEE"],
  },
]

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
                    <a href={item.url}>
                      <item.icon />
                      <span>{item.title}</span>
                    </a>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarRail />
    </Sidebar>
  )
}
