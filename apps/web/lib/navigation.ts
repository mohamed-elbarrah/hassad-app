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
  Megaphone,
  Bell,
  Ticket,
  AlertTriangle,
  Monitor,
  Globe,
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
        title: "المستخدمون",
        url: "/dashboard/admin/users",
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
        title: "الأدوار",
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
      {
        title: "بوابة العملاء",
        url: "/dashboard/admin/portal",
        icon: Globe,
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
        icon: Briefcase,
        roles: ["ADMIN"],
      },
      {
        title: "المهام",
        url: "/dashboard/admin/tasks",
        icon: ListChecks,
        roles: ["ADMIN"],
      },
      {
        title: "العقود",
        url: "/dashboard/admin/contracts",
        icon: FileSignature,
        roles: ["ADMIN"],
      },
      {
        title: "العروض الفنية",
        url: "/dashboard/admin/proposals",
        icon: FileText,
        roles: ["ADMIN"],
      },
      {
        title: "طلبات الخدمة",
        url: "/dashboard/admin/requests",
        icon: ClipboardList,
        roles: ["ADMIN"],
      },
      {
        title: "النزاعات",
        url: "/dashboard/admin/disputes",
        icon: AlertTriangle,
        roles: ["ADMIN"],
      },
    ],
  },
  {
    label: "التسويق",
    items: [
      {
        title: "الحملات",
        url: "/dashboard/admin/campaigns",
        icon: BarChart3,
        roles: ["ADMIN"],
      },
      {
        title: "الاستراتيجيات التسويقية",
        url: "/dashboard/admin/marketing/strategies",
        icon: Megaphone,
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
        icon: DollarSign,
        roles: ["ADMIN"],
      },
      {
        title: "الفواتير",
        url: "/dashboard/admin/finance/invoices",
        icon: FileText,
        roles: ["ADMIN"],
      },
      {
        title: "المدفوعات",
        url: "/dashboard/admin/finance/payments",
        icon: CreditCard,
        roles: ["ADMIN"],
      },
      {
        title: "الرواتب",
        url: "/dashboard/admin/finance/payroll",
        icon: Kanban,
        roles: ["ADMIN"],
      },
      {
        title: "الحسابات البنكية",
        url: "/dashboard/admin/finance/bank-accounts",
        icon: Building2,
        roles: ["ADMIN"],
      },
    ],
  },
  {
    label: "الإعدادات والمراقبة",
    items: [
      {
        title: "التقارير",
        url: "/dashboard/admin/reports",
        icon: BarChart3,
        roles: ["ADMIN"],
      },
      {
        title: "أداء الفريق",
        url: "/dashboard/admin/team-performance",
        icon: TrendingUp,
        roles: ["ADMIN"],
      },
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
        title: "قوالب الإشعارات",
        url: "/dashboard/admin/notification-templates",
        icon: Bell,
        roles: ["ADMIN"],
      },
      {
        title: "الأمان",
        url: "/dashboard/admin/security",
        icon: Shield,
        roles: ["ADMIN"],
      },
      {
        title: "الجلسات النشطة",
        url: "/dashboard/admin/sessions",
        icon: Monitor,
        roles: ["ADMIN"],
      },
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
      {
        title: "المحادثات",
        url: "/dashboard/admin/chat",
        icon: MessageSquare,
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
        title: "النزاعات",
        url: "/dashboard/pm/disputes",
        icon: Ticket,
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
      {
        title: "المحادثات",
        url: "/dashboard/messages",
        icon: MessageSquare,
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
      {
        title: "المحادثات",
        url: "/dashboard/messages",
        icon: MessageSquare,
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
      {
        title: "المحادثات",
        url: "/dashboard/messages",
        icon: MessageSquare,
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
