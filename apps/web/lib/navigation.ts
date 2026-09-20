import type { LucideIcon } from "lucide-react";
import {
  Briefcase,
  Kanban,
  MessageSquare,
  LayoutDashboard,
  Users,
  Handshake,
  PiggyBank,
  Activity,
  FileBarChart,
  Megaphone,
  Settings,
  DatabaseBackup,
  Plus,
  ClipboardList,
  AlertTriangle,
} from "lucide-react";

/* ── Navigation types ────────────────────────────────────────────────────────── */

export type NavSubItem = {
  title: string;
  url: string;
  exact?: boolean;
};
export type NavItem = {
  title: string;
  url: string;
  icon?: LucideIcon;
  roles: string[];
  exact?: boolean;
  items?: NavSubItem[];
};
export type NavSection = {
  label: string;
  icon: LucideIcon;
  items: NavItem[];
  layout?: "group" | "flat";
};

/* ── Admin-only navigation (Phase 6 — built in waves) ──────────────────────── */
export const adminNavSections: NavSection[] = [
  {
    label: "لوحة التحكم",
    icon: LayoutDashboard,
    items: [
      {
        title: "نظرة عامة",
        url: "/dashboard/admin",
        exact: true,
        roles: ["ADMIN"],
      },
    ],
  },
  {
    label: "إدارة الموظفين",
    icon: Users,
    items: [
      {
        title: "الموظفون",
        url: "/dashboard/admin/employees",
        roles: ["ADMIN"],
      },
    ],
  },
  {
    label: "إدارة العملاء",
    icon: Handshake,
    items: [
      {
        title: "العملاء",
        url: "/dashboard/admin/clients",
        roles: ["ADMIN"],
      },
    ],
  },
  {
    label: "العمليات",
    icon: Briefcase,
    items: [
      {
        title: "المشاريع",
        url: "/dashboard/admin/projects",
        roles: ["ADMIN"],
      },
      {
        title: "المهام",
        url: "/dashboard/admin/tasks",
        roles: ["ADMIN"],
      },
      {
        title: "العقود",
        url: "/dashboard/admin/contracts",
        roles: ["ADMIN"],
      },
      {
        title: "الطلبات",
        url: "/dashboard/admin/requests",
        roles: ["ADMIN"],
      },
      {
        title: "العروض الفنية",
        url: "/dashboard/admin/proposals",
        roles: ["ADMIN"],
      },
      {
        title: "النزاعات",
        url: "/dashboard/admin/disputes",
        roles: ["ADMIN"],
      },
    ],
  },
  {
    label: "المالية",
    icon: PiggyBank,
    items: [
      {
        title: "نظرة عامة",
        url: "/dashboard/admin/finance",
        exact: true,
        roles: ["ADMIN"],
      },
      {
        title: "الفواتير",
        url: "/dashboard/admin/finance/invoices",
        roles: ["ADMIN"],
      },
      {
        title: "المدفوعات",
        url: "/dashboard/admin/finance/payments",
        roles: ["ADMIN"],
      },
      {
        title: "بوابات الدفع",
        url: "/dashboard/admin/payment-gateways",
        roles: ["ADMIN"],
      },
    ],
  },
  {
    label: "المراقبة",
    icon: Activity,
    items: [
      {
        title: "سجل التدقيق",
        url: "/dashboard/admin/audit",
        roles: ["ADMIN"],
      },
      {
        title: "الأمان",
        url: "/dashboard/admin/security",
        roles: ["ADMIN"],
      },
      {
        title: "الجلسات",
        url: "/dashboard/admin/sessions",
        roles: ["ADMIN"],
      },
      {
        title: "صحة النظام",
        url: "/dashboard/admin/health",
        roles: ["ADMIN"],
      },
    ],
  },
  {
    label: "النسخ الاحتياطي",
    icon: DatabaseBackup,
    items: [
      {
        title: "النسخ الاحتياطي",
        url: "/dashboard/admin/backups",
        exact: true,
        roles: ["ADMIN"],
      },
    ],
  },
  {
    label: "التقارير",
    icon: FileBarChart,
    items: [
      {
        title: "التقارير",
        url: "/dashboard/admin/reports",
        roles: ["ADMIN"],
      },
    ],
  },
  {
    label: "الإعدادات",
    icon: Settings,
    items: [
      {
        title: "التكاملات",
        url: "/dashboard/admin/settings/integrations",
        roles: ["ADMIN"],
      },
      {
        title: "العملات",
        url: "/dashboard/admin/settings/currencies",
        roles: ["ADMIN"],
      },
      {
        title: "الذكاء الاصطناعي",
        url: "/dashboard/admin/ai",
        roles: ["ADMIN"],
      },
    ],
  },
];

/* ── Role-specific navigation (PM, Sales, Marketing, Accountant, Employee) ──── */

export const roleNavSections: NavSection[] = [
  {
    label: "المشاريع",
    icon: Briefcase,
    layout: "flat",
    items: [
      {
        title: "المشاريع",
        url: "/dashboard/pm",
        icon: Briefcase,
        exact: true,
        roles: ["PM"],
      },
      {
        title: "المهام",
        url: "/dashboard/pm/tasks",
        icon: Activity,
        roles: ["PM"],
      },
      {
        title: "طلبات التعديل",
        url: "/dashboard/pm/requests",
        icon: ClipboardList,
        roles: ["PM"],
      },
      {
        title: "النزاعات",
        url: "/dashboard/pm/disputes",
        icon: AlertTriangle,
        roles: ["PM"],
      },
      {
        title: "المحادثات",
        url: "/dashboard/pm/chat",
        icon: MessageSquare,
        roles: ["PM"],
      },
    ],
  },
  {
    label: "المبيعات",
    icon: Kanban,
    layout: "flat",
    items: [
      {
        title: "إنشاء طلب جديد",
        url: "/dashboard/sales/requests/new",
        icon: Plus,
        roles: ["SALES"],
      },
      {
        title: "لوحة المبيعات",
        url: "/dashboard/sales/pipeline",
        icon: Kanban,
        exact: true,
        roles: ["SALES"],
      },
      {
        title: "العملاء",
        url: "/dashboard/sales/clients",
        icon: Users,
        roles: ["SALES"],
      },
      {
        title: "المحادثات",
        url: "/dashboard/sales/chat",
        icon: MessageSquare,
        roles: ["SALES"],
      },
      {
        title: "العروض الفنية",
        url: "/dashboard/sales/proposals",
        icon: FileBarChart,
        roles: ["SALES"],
      },
      {
        title: "العقود",
        url: "/dashboard/sales/contracts",
        icon: Handshake,
        roles: ["SALES"],
      },
    ],
  },
  {
    label: "فريق",
    icon: Users,
    layout: "flat",
    items: [
      {
        title: "قائمة المهام",
        url: "/dashboard/team",
        icon: ClipboardList,
        roles: ["TEAM"],
      },
    ],
  },
  {
    label: "التسويق",
    icon: Megaphone,
    layout: "flat",
    items: [
      {
        title: "لوحة التحكم",
        url: "/dashboard/marketing",
        icon: LayoutDashboard,
        exact: true,
        roles: ["MARKETING"],
      },
      {
        title: "الحملات",
        url: "/dashboard/marketing/campaigns",
        icon: Megaphone,
        roles: ["MARKETING"],
      },
    ],
  },
  {
    label: "المالية",
    icon: PiggyBank,
    layout: "flat",
    items: [
      {
        title: "لوحة التحكم المالية",
        url: "/dashboard/finance",
        icon: LayoutDashboard,
        exact: true,
        roles: ["ACCOUNTANT"],
      },
      {
        title: "إدارة الفواتير",
        url: "/dashboard/finance/invoices",
        icon: FileBarChart,
        roles: ["ACCOUNTANT"],
      },
      {
        title: "المدفوعات",
        url: "/dashboard/finance/payments",
        icon: PiggyBank,
        roles: ["ACCOUNTANT"],
      },
      {
        title: "الرواتب والأجور",
        url: "/dashboard/finance/payroll",
        icon: Users,
        roles: ["ACCOUNTANT"],
      },
      {
        title: "سجل التدقيق",
        url: "/dashboard/finance/ledger",
        icon: Activity,
        roles: ["ACCOUNTANT"],
      },
    ],
  },
];

/* ── Shared dashboard navigation ───────────────────────────────────────────── */

export const adminChatNavSection: NavSection = {
  label: "التواصل",
  icon: MessageSquare,
  items: [
    {
      title: "المحادثات",
      url: "/dashboard/admin/chat",
      exact: true,
      roles: ["ADMIN"],
    },
  ],
};

export const sharedNavSections: NavSection[] = [
  {
    label: "التواصل",
    icon: MessageSquare,
    layout: "flat",
    items: [
      {
        title: "المحادثات",
        url: "/dashboard/messages",
        icon: MessageSquare,
        exact: true,
        roles: ["TEAM", "MARKETING", "ACCOUNTANT"],
      },
    ],
  },
];

/* ── Legacy combined export — used only for backward compat, rename later ───── */

/** @deprecated Use adminNavSections or roleNavSections directly */
export const navSections: NavSection[] = [
  ...adminNavSections,
  adminChatNavSection,
  ...roleNavSections,
  ...sharedNavSections,
];
