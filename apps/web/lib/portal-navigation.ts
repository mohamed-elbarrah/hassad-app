import {
  Home,
  Inbox,
  FileText,
  Receipt,
  BarChart3,
  CheckCircle2,
  FolderOpen,
  Bell,
  ClipboardList,
  MessageSquare,
  TrendingUp,
  User,
  Settings,
  type LucideIcon,
} from "lucide-react";

export interface PortalNavItem {
  label: string;
  href: string;
  icon: LucideIcon;
}

export interface PortalNavGroup {
  key: string;
  label: string;
  icon: LucideIcon;
  items: PortalNavItem[];
}

export const PORTAL_STANDALONE_ITEMS: PortalNavItem[] = [
  { label: "الرئيسية", href: "/portal", icon: Home },
  { label: "الملف التعريفي", href: "/portal/profile", icon: User },
];

export const PORTAL_NAV_GROUPS: PortalNavGroup[] = [
  {
    key: "orders",
    label: "الطلبات والمشاريع",
    icon: ClipboardList,
    items: [
      { label: "الطلبات", href: "/portal/requests", icon: ClipboardList },
      { label: "المشاريع", href: "/portal/projects", icon: FolderOpen },
    ],
  },
  {
    key: "communication",
    label: "التواصل",
    icon: MessageSquare,
    items: [
      { label: "المحادثات", href: "/portal/chat", icon: MessageSquare },
      { label: "الإشعارات", href: "/portal/notifications", icon: Bell },
      { label: "إجراءاتي", href: "/portal/actions", icon: CheckCircle2 },
    ],
  },
  {
    key: "documents",
    label: "المستندات",
    icon: FileText,
    items: [
      { label: "العقود", href: "/portal/contracts", icon: FileText },
      { label: "العروض الفنية", href: "/portal/proposals", icon: FileText },
      { label: "مراجعة التسليمات", href: "/portal/deliverables", icon: Inbox },
    ],
  },
  {
    key: "finance",
    label: "المالية والتسويق",
    icon: Receipt,
    items: [
      { label: "الفواتير والمدفوعات", href: "/portal/finance", icon: Receipt },
      { label: "الحملات الإعلانية", href: "/portal/campaigns", icon: TrendingUp },
      { label: "الدراسات التسويقية", href: "/portal/marketing-strategies", icon: FileText },
      { label: "التقارير", href: "/portal/reports", icon: BarChart3 },
    ],
  },
];

export const PORTAL_BOTTOM_PRIMARY: PortalNavItem[] = [
  { label: "الرئيسية", href: "/portal", icon: Home },
  { label: "المشاريع", href: "/portal/projects", icon: FolderOpen },
  { label: "الفواتير", href: "/portal/finance", icon: Receipt },
  { label: "إجراءاتي", href: "/portal/actions", icon: CheckCircle2 },
];

export const PORTAL_MORE_ITEMS: PortalNavItem[] = [
  { label: "المحادثات", href: "/portal/chat", icon: MessageSquare },
  { label: "الإشعارات", href: "/portal/notifications", icon: Bell },
  { label: "الطلبات", href: "/portal/requests", icon: ClipboardList },
  { label: "العقود", href: "/portal/contracts", icon: FileText },
  { label: "العروض", href: "/portal/proposals", icon: FileText },
  { label: "مراجعة التسليمات", href: "/portal/deliverables", icon: Inbox },
  { label: "الحملات", href: "/portal/campaigns", icon: TrendingUp },
  { label: "التقارير", href: "/portal/reports", icon: BarChart3 },
  { label: "الإعدادات", href: "/portal/account", icon: Settings },
];

export function isPortalActiveLink(href: string, pathname: string) {
  if (href === "/portal") return pathname === "/portal";
  return pathname === href || pathname.startsWith(href + "/");
}
