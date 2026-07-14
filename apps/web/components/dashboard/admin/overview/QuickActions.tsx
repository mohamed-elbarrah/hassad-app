"use client";

import { useRouter } from "next/navigation";
import {
  Zap,
  FolderPlus,
  FilePlus,
  UserPlus,
  UserCog,
  Megaphone,
  BarChart3,
  type LucideIcon,
} from "lucide-react";
import { SurfaceCard } from "@/components/design-system/SurfaceCard";

export interface QuickAction {
  key: string;
  label: string;
  icon: LucideIcon;
  href: string;
  description?: string;
}

const DEFAULT_ACTIONS: QuickAction[] = [
  {
    key: "newProject",
    label: "مشروع جديد",
    icon: FolderPlus,
    href: "/dashboard/admin/projects/new",
  },
  {
    key: "newInvoice",
    label: "فاتورة جديدة",
    icon: FilePlus,
    href: "/dashboard/admin/finance/invoices/new",
  },
  {
    key: "newClient",
    label: "عميل جديد",
    icon: UserPlus,
    href: "/dashboard/admin/clients/new",
  },
  {
    key: "newUser",
    label: "مستخدم جديد",
    icon: UserCog,
      href: "/dashboard/admin/employees/new",
  },
  {
    key: "newCampaign",
    label: "حملة تسويق",
    icon: Megaphone,
    href: "/dashboard/admin/marketing/campaigns/new",
  },
  {
    key: "viewReports",
    label: "تقرير مالي",
    icon: BarChart3,
    href: "/dashboard/admin/reports",
  },
];

interface QuickActionsProps {
  actions?: QuickAction[];
  className?: string;
}

export function QuickActions({
  actions = DEFAULT_ACTIONS,
  className,
}: QuickActionsProps) {
  const router = useRouter();

  if (actions.length === 0) return null;

  return (
    <SurfaceCard title="إجراءات سريعة" icon={Zap} className={className}>
      <div className="grid grid-cols-3 gap-3">
        {actions.map((action) => (
          <button
            key={action.key}
            type="button"
            onClick={() => router.push(action.href)}
            className="flex flex-col items-center justify-center gap-2 rounded-2xl border border-portal-card-border p-4 hover:bg-badge-gray-bg transition-colors cursor-pointer"
          >
            <action.icon className="h-8 w-8 text-secondary-500" />
            <span className="text-xs font-medium text-natural-100 text-center">
              {action.label}
            </span>
          </button>
        ))}
      </div>
    </SurfaceCard>
  );
}
