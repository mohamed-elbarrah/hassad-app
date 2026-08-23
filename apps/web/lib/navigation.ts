import type { LucideIcon } from "lucide-react";
import {
  Building2,
  Shield,
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
  Ticket,
  LayoutDashboard,
  Users,
  FolderKanban,
  CheckSquare,
  FileSpreadsheet,
  Handshake,
  PiggyBank,
  Scale,
  Activity,
  FileBarChart,
  Lock,
  Database,
  Globe,
  AlertTriangle,
  DollarSign,
  CreditCard,
  Bot,
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
  icon: LucideIcon;
  roles: string[];
  exact?: boolean;
  items?: NavSubItem[];
};
export type NavSection = { label: string; items: NavItem[] };

/* ── Admin-only navigation (Phase 6 — built in waves) ──────────────────────── */
export const adminNavSections: NavSection[] = [
  {
    label: "لوحة التحكم",
    items: [
      {
        title: "نظرة عامة",
        url: "/dashboard/admin",
        exact: true,
        icon: LayoutDashboard,
        roles: ["ADMIN"],
      },
    ],
  },
  {
    label: "إدارة الموظفين",
    items: [
      {
        title: "الموظفون",
        url: "/dashboard/admin/employees",
        icon: Users,
        roles: ["ADMIN"],
      },
    ],
  },
  {
    label: "إدارة العملاء",
    items: [
      {
        title: "العملاء",
        url: "/dashboard/admin/clients",
        icon: Handshake,
        roles: ["ADMIN"],
      },
    ],
  },
  {
    label: "العمليات",
    items: [
      {
        title: "المشاريع",
        url: "/dashboard/admin/projects",
        icon: FolderKanban,
        roles: ["ADMIN"],
      },
      {
        title: "المهام",
        url: "/dashboard/admin/tasks",
        icon: CheckSquare,
        roles: ["ADMIN"],
      },
      {
        title: "العقود",
        url: "/dashboard/admin/contracts",
        icon: FileSignature,
        roles: ["ADMIN"],
      },
      {
        title: "الطلبات",
        url: "/dashboard/admin/requests",
        icon: ClipboardList,
        roles: ["ADMIN"],
      },
      {
        title: "العروض الفنية",
        url: "/dashboard/admin/proposals",
        icon: FileText,
        roles: ["ADMIN"],
      },
      {
        title: "النزاعات",
        url: "/dashboard/admin/disputes",
        icon: Scale,
        roles: ["ADMIN"],
      },
    ],
  },
  {
    label: "المالية",
    items: [
      {
        title: "نظرة عامة",
        url: "/dashboard/admin/finance",
        exact: true,
        icon: PiggyBank,
        roles: ["ADMIN"],
      },
      {
        title: "الفواتير",
        url: "/dashboard/admin/finance/invoices",
        icon: FileSpreadsheet,
        roles: ["ADMIN"],
      },
      {
        title: "المدفوعات",
        url: "/dashboard/admin/finance/payments",
        icon: TrendingUp,
        roles: ["ADMIN"],
      },
      {
        title: "بوابات الدفع",
        url: "/dashboard/admin/payment-gateways",
        icon: CreditCard,
        roles: ["ADMIN"],
      },
    ],
  },
  {
    label: "المراقبة",
    items: [
      {
        title: "سجل التدقيق",
        url: "/dashboard/admin/audit",
        icon: Activity,
        roles: ["ADMIN"],
      },
      {
        title: "الأمان",
        url: "/dashboard/admin/security",
        icon: Lock,
        roles: ["ADMIN"],
      },
      {
        title: "الجلسات",
        url: "/dashboard/admin/sessions",
        icon: Database,
        roles: ["ADMIN"],
      },
      {
        title: "صحة النظام",
        url: "/dashboard/admin/health",
        icon: AlertTriangle,
        roles: ["ADMIN"],
      },
    ],
  },
  {
    label: "التقارير",
    items: [
      {
        title: "التقارير",
        url: "/dashboard/admin/reports",
        icon: FileBarChart,
        roles: ["ADMIN"],
      },
    ],
  },
  {
    label: "الإعدادات",
    items: [
      {
        title: "التكاملات",
        url: "/dashboard/admin/integrations",
        icon: Globe,
        roles: ["ADMIN"],
      },
      {
        title: "العملات",
        url: "/dashboard/admin/settings/currencies",
        icon: DollarSign,
        roles: ["ADMIN"],
      },
      {
        title: "الذكاء الاصطناعي",
        url: "/dashboard/admin/ai",
        icon: Bot,
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
        title: "المشاريع",
        url: "/dashboard/pm",
        exact: true,
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
        title: "النزاعات",
        url: "/dashboard/pm/disputes",
        icon: Ticket,
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
        exact: true,
        icon: Kanban,
        roles: ["SALES"],
      },
      {
        title: "العملاء",
        url: "/dashboard/sales/clients",
        icon: Building2,
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
    ],
  },
  {
    label: "فريق",
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
    items: [
      {
        title: "لوحة التحكم",
        url: "/dashboard/marketing",
        exact: true,
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
        exact: true,
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

/* ── Shared dashboard navigation ───────────────────────────────────────────── */

export const sharedNavSections: NavSection[] = [
  {
    label: "التواصل",
    items: [
      {
        title: "المحادثات",
        url: "/dashboard/messages",
        exact: true,
        icon: MessageSquare,
        roles: ["ADMIN", "PM", "SALES", "TEAM", "MARKETING", "ACCOUNTANT"],
      },
    ],
  },
];

/* ── Legacy combined export — used only for backward compat, rename later ───── */

/** @deprecated Use adminNavSections or roleNavSections directly */
export const navSections: NavSection[] = [
  ...adminNavSections,
  ...roleNavSections,
  ...sharedNavSections,
];
