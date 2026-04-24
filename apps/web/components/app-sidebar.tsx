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
  Shield,
  FileText,
  FileSignature,
  Ticket,
  UserCircle,
  ListChecks,
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
    title: "لوحة الإدارة العليا",
    url: "/dashboard/admin",
    icon: Home,
    roles: ["ADMIN"],
  },
  {
    title: "إدارة العملاء (CRM)",
    url: "/dashboard/admin/clients",
    icon: Users,
    roles: ["ADMIN"],
  },
  {
    title: "الموظفون",
    url: "/dashboard/admin/employees",
    icon: Users,
    roles: ["ADMIN"],
  },
  {
    title: "الإعدادات والصلاحيات",
    url: "/dashboard/admin/settings",
    icon: Shield,
    roles: ["ADMIN"],
  },
  {
    title: "لوحة مدير المشروع",
    url: "/dashboard/pm",
    icon: Briefcase,
    roles: ["ADMIN", "PM"],
  },
  {
    title: "المشاريع",
    url: "/dashboard/pm/projects",
    icon: Briefcase,
    roles: ["ADMIN", "PM"],
  },
  {
    title: "المهام",
    url: "/dashboard/pm/tasks",
    icon: ListChecks,
    roles: ["ADMIN", "PM"],
  },
  {
    title: "طلبات التعديل",
    url: "/dashboard/pm/requests",
    icon: ClipboardList,
    roles: ["ADMIN", "PM"],
  },
  {
    title: "لوحة المبيعات",
    url: "/dashboard/sales/pipeline",
    icon: Kanban,
    roles: ["ADMIN", "SALES"],
  },
  {
    title: "العروض الفنية",
    url: "/dashboard/sales/proposals",
    icon: FileText,
    roles: ["ADMIN", "SALES"],
  },
  {
    title: "العقود",
    url: "/dashboard/sales/contracts",
    icon: FileSignature,
    roles: ["ADMIN", "SALES"],
  },
  {
    title: "لوحة الموظف التنفيذي",
    url: "/dashboard/employee",
    icon: ClipboardList,
    roles: ["EMPLOYEE"],
  },
  {
    title: "لوحة التسويق",
    url: "/dashboard/marketing",
    icon: Megaphone,
    roles: ["ADMIN", "MARKETING"],
  },
  {
    title: "عملاء التسويق",
    url: "/dashboard/marketing/clients",
    icon: Users,
    roles: ["ADMIN", "MARKETING"],
  },
  {
    title: "الحملات",
    url: "/dashboard/marketing/campaigns",
    icon: Megaphone,
    roles: ["ADMIN", "MARKETING"],
  },
  {
    title: "الفواتير",
    url: "/dashboard/accountant/invoices",
    icon: FileText,
    roles: ["ADMIN", "ACCOUNTANT"],
  },
  {
    title: "التذاكر المالية",
    url: "/dashboard/accountant/tickets",
    icon: Ticket,
    roles: ["ADMIN", "ACCOUNTANT"],
  },
  {
    title: "عقود مالية",
    url: "/dashboard/accountant/contracts",
    icon: FileSignature,
    roles: ["ADMIN", "ACCOUNTANT"],
  },
  {
    title: "الحساب الشخصي",
    url: "/dashboard/account",
    icon: UserCircle,
    roles: ["ADMIN", "PM", "SALES", "EMPLOYEE", "MARKETING", "ACCOUNTANT"],
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
