import type { LucideIcon } from "lucide-react";
import {
  Home,
  Users,
  Briefcase,
  Megaphone,
  Kanban,
  ClipboardList,
  Shield,
  FileText,
  FileSignature,
  Ticket,
  ListChecks,
  BarChart3,
  TrendingUp,
  PlusCircle,
  MessageSquare,
} from "lucide-react";

/* ── Navigation types ────────────────────────────────────────────────────────── */

export type NavSubItem = { title: string; url: string };
export type NavItem = {
  title: string;
  url?: string;
  icon: LucideIcon;
  roles: string[];
  items?: NavSubItem[];
};
export type NavSection = { label: string; items: NavItem[] };

/* ── Navigation config ───────────────────────────────────────────────────────── */

export const navSections: NavSection[] = [
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
          { title: "العملاء", url: "/dashboard/admin/clients" },
          { title: "الأقسام", url: "/dashboard/admin/departments" },
        ],
      },
      {
        title: "إعدادات النظام",
        icon: Shield,
        roles: ["ADMIN"],
        items: [
          { title: "الصلاحيات", url: "/dashboard/admin/settings" },
          {
            title: "إعدادات العملة",
            url: "/dashboard/admin/settings/currency",
          },
          { title: "بوابات الدفع", url: "/dashboard/admin/payments" },
          { title: "الخدمات", url: "/dashboard/admin/settings/services" },
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
      {
        title: "المحادثات",
        url: "/dashboard/messages",
        icon: MessageSquare,
        roles: ["ADMIN", "PM"],
      },
    ],
  },
  {
    label: "المبيعات",
    items: [
      {
        title: "إنشاء طلب جديد",
        url: "/dashboard/sales/requests/new",
        icon: PlusCircle,
        roles: ["ADMIN", "SALES", "CLIENT"],
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
        title: "المحادثات",
        url: "/dashboard/messages",
        icon: MessageSquare,
        roles: ["ADMIN", "SALES"],
      },
    ],
  },
  {
    label: "الموظف التنفيذي",
    items: [
      {
        title: "قائمة المهام",
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
