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
  Leaf,
} from "lucide-react";

import { useAppSelector } from "@/lib/hooks";
import { UserRole, TaskDepartment } from "@hassad/shared";
import { NavUser } from "@/components/nav-user";

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
  SidebarSeparator,
} from "@/components/ui/sidebar";

// ── Navigation items ──────────────────────────────────────────────────────────

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

// ── Role / department display helpers ─────────────────────────────────────────

const ROLE_LABELS: Record<UserRole, string> = {
  [UserRole.ADMIN]: "مدير النظام",
  [UserRole.PM]: "مدير المشاريع",
  [UserRole.SALES]: "فريق المبيعات",
  [UserRole.ACCOUNTANT]: "محاسب",
  [UserRole.MARKETING]: "مسوق",
  [UserRole.EMPLOYEE]: "موظف",
  [UserRole.CLIENT]: "عميل",
};

const DEPT_LABELS: Record<TaskDepartment, string> = {
  [TaskDepartment.DESIGN]: "مصمم",
  [TaskDepartment.MARKETING]: "مسوق",
  [TaskDepartment.DEVELOPMENT]: "مطور",
  [TaskDepartment.CONTENT]: "كاتب محتوى",
  [TaskDepartment.MANAGEMENT]: "مدير",
};

// ── Component ─────────────────────────────────────────────────────────────────

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { user } = useAppSelector((state) => state.auth);

  const navItems = allNavItems.filter((item) => {
    if (!user) return false;
    return item.roles.includes(user.role);
  });

  // For employees show department name; for others show role label
  const roleLabel = user
    ? user.role === UserRole.EMPLOYEE && user.department
      ? (DEPT_LABELS[user.department as TaskDepartment] ??
        ROLE_LABELS[user.role as UserRole])
      : ROLE_LABELS[user.role as UserRole]
    : "";

  return (
    <Sidebar side="right" variant="inset" collapsible="icon" {...props}>
      {/* ── Header: platform logo + name ── */}
      <SidebarHeader>
        <div className="flex items-center gap-2 px-1 py-1">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground shrink-0">
            <Leaf className="h-4 w-4" />
          </div>
          <div className="grid leading-tight group-data-[collapsible=icon]:hidden">
            <span className="truncate font-semibold text-sm">حصاد</span>
            <span className="truncate text-xs text-muted-foreground">
              {roleLabel}
            </span>
          </div>
        </div>
      </SidebarHeader>

      <SidebarSeparator />

      {/* ── Nav items ── */}
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

      <SidebarSeparator />

      {/* ── Footer: user menu ── */}
      <SidebarFooter>
        <NavUser />
      </SidebarFooter>
    </Sidebar>
  );
}
