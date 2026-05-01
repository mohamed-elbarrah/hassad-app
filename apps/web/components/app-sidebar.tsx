"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home,
  Users,
  Briefcase,
  Megaphone,
  Kanban,
  ClipboardList,
  Leaf,
  Shield,
  FileText,
  FileSignature,
  Ticket,
  ListChecks,
  BarChart3,
  TrendingUp,
  ChevronRight,
  type LucideIcon,
} from "lucide-react";

import { useAppSelector } from "@/lib/hooks";
import { UserRole, TaskDepartment } from "@hassad/shared";
import { NavUser } from "@/components/nav-user";

import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
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
  SidebarSeparator,
} from "@/components/ui/sidebar";

// ── Navigation types ──────────────────────────────────────────────────────────

type NavSubItem = { title: string; url: string };
type NavItem = {
  title: string;
  url?: string;
  icon: LucideIcon;
  roles: string[];
  items?: NavSubItem[];
};
type NavSection = { label: string; items: NavItem[] };

// ── Navigation config ─────────────────────────────────────────────────────────

const navSections: NavSection[] = [
  {
    label: "الإدارة",
    items: [
      {
        title: "لوحة الإدارة العليا",
        url: "/dashboard/admin",
        icon: Home,
        roles: ["ADMIN"],
      },
      {
        title: "إدارة الحسابات",
        icon: Users,
        roles: ["ADMIN"],
        items: [
          { title: "الموظفون", url: "/dashboard/admin/employees" },
          { title: "العملاء (CRM)", url: "/dashboard/admin/clients" },
        ],
      },
      {
        title: "إعدادات النظام",
        icon: Shield,
        roles: ["ADMIN"],
        items: [
          { title: "الصلاحيات", url: "/dashboard/admin/settings" },
          { title: "بوابات الدفع", url: "/dashboard/admin/payments" },
        ],
      },
    ],
  },
  {
    label: "المشاريع",
    items: [
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
    ],
  },
  {
    label: "المبيعات",
    items: [
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
    ],
  },
  {
    label: "الموظف التنفيذي",
    items: [
      {
        title: "لوحة الموظف التنفيذي",
        url: "/dashboard/employee",
        icon: ClipboardList,
        roles: ["EMPLOYEE"],
      },
    ],
  },
    {
      label: "التسويق",
      items: [
        {
          title: "لوحة التحكم",
          url: "/dashboard/marketing",
          icon: BarChart3,
          roles: ["ADMIN", "MARKETING"],
        },
        {
          title: "المهام المسندة",
          url: "/dashboard/marketing/tasks",
          icon: ListChecks,
          roles: ["ADMIN", "MARKETING"],
        },
      ],
    },
  {
    label: "المالية",
    items: [
      {
        title: "لوحة التحكم المالية",
        url: "/dashboard/finance",
        icon: BarChart3,
        roles: ["ADMIN", "ACCOUNTANT"],
      },
      {
        title: "إدارة الفواتير",
        url: "/dashboard/finance/invoices",
        icon: FileText,
        roles: ["ADMIN", "ACCOUNTANT"],
      },
      {
        title: "المدفوعات",
        url: "/dashboard/finance/payments",
        icon: TrendingUp,
        roles: ["ADMIN", "ACCOUNTANT"],
      },
      {
        title: "الرواتب والأجور",
        url: "/dashboard/finance/payroll",
        icon: Kanban,
        roles: ["ADMIN", "ACCOUNTANT"],
      },
      {
        title: "سجل التدقيق",
        url: "/dashboard/finance/ledger",
        icon: Shield,
        roles: ["ADMIN", "ACCOUNTANT"],
      },
    ],
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
  [TaskDepartment.PRODUCTION]: "مونتير",
};

// ── Component ─────────────────────────────────────────────────────────────────

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { user } = useAppSelector((state) => state.auth);
  const pathname = usePathname();

  // For employees show department name; for others show role label
  const roleLabel = user
    ? user.role === UserRole.EMPLOYEE && user.department
      ? (DEPT_LABELS[user.department as TaskDepartment] ??
        ROLE_LABELS[user.role as UserRole])
      : ROLE_LABELS[user.role as UserRole]
    : "";

  // Filter sections and items by user role; drop empty sections
  const visibleSections = navSections
    .map((section) => ({
      ...section,
      items: section.items.filter(
        (item) => user && item.roles.includes(user.role),
      ),
    }))
    .filter((section) => section.items.length > 0);

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

      {/* ── Nav sections ── */}
      <SidebarContent>
        {visibleSections.map((section, sectionIdx) => (
          <React.Fragment key={section.label}>
            <SidebarGroup>
              <SidebarGroupLabel>{section.label}</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {section.items.map((item) =>
                    item.items ? (
                      /* Collapsible parent (e.g. إدارة الحسابات) */
                      <Collapsible
                        key={item.title}
                        defaultOpen={item.items.some((sub) =>
                          pathname.startsWith(sub.url),
                        )}
                        className="group/collapsible"
                      >
                        <SidebarMenuItem>
                          <CollapsibleTrigger asChild>
                            <SidebarMenuButton tooltip={item.title}>
                              <item.icon />
                              <span>{item.title}</span>
                              <ChevronRight className="mr-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                            </SidebarMenuButton>
                          </CollapsibleTrigger>
                          <CollapsibleContent>
                            <SidebarMenuSub>
                              {item.items.map((sub) => (
                                <SidebarMenuSubItem key={sub.title}>
                                  <SidebarMenuSubButton
                                    asChild
                                    isActive={pathname.startsWith(sub.url)}
                                  >
                                    <Link href={sub.url}>
                                      <span>{sub.title}</span>
                                    </Link>
                                  </SidebarMenuSubButton>
                                </SidebarMenuSubItem>
                              ))}
                            </SidebarMenuSub>
                          </CollapsibleContent>
                        </SidebarMenuItem>
                      </Collapsible>
                    ) : (
                      /* Plain link item */
                      <SidebarMenuItem key={item.title}>
                        <SidebarMenuButton
                          asChild
                          isActive={
                            item.url !== undefined &&
                            pathname.startsWith(item.url)
                          }
                        >
                          <Link href={item.url ?? "#"}>
                            <item.icon />
                            <span>{item.title}</span>
                          </Link>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    ),
                  )}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
            {sectionIdx < visibleSections.length - 1 && <SidebarSeparator />}
          </React.Fragment>
        ))}
      </SidebarContent>

      <SidebarSeparator />

      {/* ── Footer: user menu ── */}
      <SidebarFooter>
        <NavUser />
      </SidebarFooter>
    </Sidebar>
  );
}
