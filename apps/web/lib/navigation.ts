import type { LucideIcon } from "lucide-react";
import {
  LayoutDashboard,
  Users,
  Building2,
  Shield,
  ScrollText,
  Activity,
  Settings,
  Wrench,
  DollarSign,
  CreditCard,
  Briefcase,
  ListChecks,
  ClipboardList,
  Kanban,
  FileText,
  FileSignature,
  PlusCircle,
  MessageSquare,
  BarChart3,
  TrendingUp,
  Bell,
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

/* ── Admin-only navigation ──────────────────────────────────────────────────── */

export const adminNavSections: NavSection[] = [
  {
    label: "الرئيسية",
    items: [
      {
        title: "لوحة التحكم",
        url: "/dashboard/admin",
        icon: LayoutDashboard,
        roles: ["ADMIN"],
      },
    ],
  },
  {
    label: "إدارة المستخدمين",
    items: [
      {
        title: "الموظفون",
        url: "/dashboard/admin/employees",
        icon: Users,
        roles: ["ADMIN"],
      },
      {
        title: "العملاء",
        url: "/dashboard/admin/clients",
        icon: Building2,
        roles: ["ADMIN"],
      },
      {
        title: "الأدوار والصلاحيات",
        url: "/dashboard/admin/roles",
        icon: Shield,
        roles: ["ADMIN"],
      },
      {
        title: "الأقسام",
        url: "/dashboard/admin/departments",
        icon: Briefcase,
        roles: ["ADMIN"],
      },
    ],
  },
  {
    label: "المراقبة",
    items: [
      {
        title: "سجل النشاطات",
        url: "/dashboard/admin/audit-log",
        icon: ScrollText,
        roles: ["ADMIN"],
      },
      {
        title: "صحة النظام",
        url: "/dashboard/admin/health",
        icon: Activity,
        roles: ["ADMIN"],
      },
    ],
  },
  {
    label: "الإعدادات",
    items: [
      {
        title: "إعدادات المنصة",
        url: "/dashboard/admin/settings",
        icon: Settings,
        roles: ["ADMIN"],
      },
      {
        title: "الخدمات",
        url: "/dashboard/admin/services",
        icon: Wrench,
        roles: ["ADMIN"],
      },
      {
        title: "العملات",
        url: "/dashboard/admin/currency",
        icon: DollarSign,
        roles: ["ADMIN"],
      },
      {
        title: "بوابات الدفع",
        url: "/dashboard/admin/payments",
        icon: CreditCard,
        roles: ["ADMIN"],
      },
    ],
  },
];

/* ── Role-specific navigation (PM, Sales, Marketing, Accountant, Employee) ──── */

export const roleNavSections: NavSection[] = [
  {
    label: "المشاريع",
    items: [
      {
        title: "لوحة مدير المشروع",
        url: "/dashboard/pm",
        icon: Briefcase,
        roles: ["PM"],
      },
      {
        title: "المشاريع",
        url: "/dashboard/pm/projects",
        icon: Briefcase,
        roles: ["PM"],
      },
      {
        title: "المهام",
        url: "/dashboard/pm/tasks",
        icon: ListChecks,
        roles: ["PM"],
      },
      {
        title: "طلبات التعديل",
        url: "/dashboard/pm/requests",
        icon: ClipboardList,
        roles: ["PM"],
      },
      {
        title: "المحادثات",
        url: "/dashboard/messages",
        icon: MessageSquare,
        roles: ["PM"],
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
        roles: ["SALES"],
      },
      {
        title: "لوحة المبيعات",
        url: "/dashboard/sales/pipeline",
        icon: Kanban,
        roles: ["SALES"],
      },
      {
        title: "العروض الفنية",
        url: "/dashboard/sales/proposals",
        icon: FileText,
        roles: ["SALES"],
      },
      {
        title: "العقود",
        url: "/dashboard/sales/contracts",
        icon: FileSignature,
        roles: ["SALES"],
      },
      {
        title: "المحادثات",
        url: "/dashboard/messages",
        icon: MessageSquare,
        roles: ["SALES"],
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
        roles: ["MARKETING"],
      },
      {
        title: "المهام المسندة",
        url: "/dashboard/marketing/tasks",
        icon: ListChecks,
        roles: ["MARKETING"],
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
        roles: ["ACCOUNTANT"],
      },
      {
        title: "إدارة الفواتير",
        url: "/dashboard/finance/invoices",
        icon: FileText,
        roles: ["ACCOUNTANT"],
      },
      {
        title: "المدفوعات",
        url: "/dashboard/finance/payments",
        icon: TrendingUp,
        roles: ["ACCOUNTANT"],
      },
      {
        title: "الرواتب والأجور",
        url: "/dashboard/finance/payroll",
        icon: Kanban,
        roles: ["ACCOUNTANT"],
      },
      {
        title: "سجل التدقيق",
        url: "/dashboard/finance/ledger",
        icon: Shield,
        roles: ["ACCOUNTANT"],
      },
    ],
  },
];

/* ── Legacy combined export — used only for backward compat, rename later ───── */

/** @deprecated Use adminNavSections or roleNavSections directly */
export const navSections: NavSection[] = [
  ...adminNavSections,
  ...roleNavSections,
];
