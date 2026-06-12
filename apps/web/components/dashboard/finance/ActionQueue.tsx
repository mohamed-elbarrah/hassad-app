"use client";

import Link from "next/link";
import { cn } from "@/lib/utils";
import { formatCurrency } from "@/lib/format";
import { SurfaceCard } from "@/components/design-system/SurfaceCard";
import { ActionButton } from "@/components/design-system/ActionButton";
import {
  AlertTriangle,
  Send,
  RefreshCcw,
  Wallet,
  ChevronLeft,
} from "lucide-react";

interface FinanceAction {
  id: string;
  type: "LATE_INVOICE" | "UNSENT_INVOICE" | "FAILED_PAYMENT" | "PENDING_SALARY";
  title: string;
  description: string;
  amount?: number;
  entityId: string;
  priority: "HIGH" | "MEDIUM" | "LOW";
}

interface Props {
  actions: FinanceAction[];
  isLoading?: boolean;
}

const typeConfig = {
  LATE_INVOICE: {
    icon: AlertTriangle,
    iconBg: "bg-danger-50 text-danger-600",
    actionLabel: "متابعة",
    href: (id: string) => `/dashboard/finance/invoices/${id}`,
  },
  UNSENT_INVOICE: {
    icon: Send,
    iconBg: "bg-secondary-50 text-secondary-600",
    actionLabel: "إرسال",
    href: (id: string) => `/dashboard/finance/invoices/${id}`,
  },
  FAILED_PAYMENT: {
    icon: RefreshCcw,
    iconBg: "bg-alert-50 text-alert-600",
    actionLabel: "مراجعة",
    href: (id: string) => `/dashboard/finance/payments`,
  },
  PENDING_SALARY: {
    icon: Wallet,
    iconBg: "bg-success-50 text-success-600",
    actionLabel: "صرف",
    href: () => `/dashboard/finance/payroll`,
  },
};

export function ActionQueue({ actions, isLoading }: Props) {
  if (isLoading) {
    return (
      <SurfaceCard className="border-none shadow-md h-full" title="المهام المطلوبة">
        <div className="space-y-3 animate-pulse">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-14 bg-neutral-100 rounded-xl" />
          ))}
        </div>
      </SurfaceCard>
    );
  }

  return (
    <SurfaceCard
      className="border-none shadow-md h-full"
      title="المهام المطلوبة"
      description="الإجراءات التي تتطلب اهتماماً فورياً"
      icon={AlertTriangle}
    >
      <div className="space-y-2 pt-1">
        {actions.map((action) => {
          const config = typeConfig[action.type];
          const Icon = config.icon;
          return (
            <div
              key={action.id}
              className={cn(
                "flex items-center gap-3 p-3 rounded-xl border transition-all hover:shadow-sm",
                action.priority === "HIGH"
                  ? "border-danger-200 bg-danger-50/30"
                  : "border-portal-card-border bg-natural-0",
              )}
            >
              <div className={cn("p-2 rounded-lg shrink-0", config.iconBg)}>
                <Icon className="w-4 h-4" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-natural-100 truncate">{action.title}</p>
                <div className="flex items-center gap-2 text-xs text-neutral-400">
                  <span>{action.description}</span>
                  {action.amount !== undefined && (
                    <span className="font-semibold text-natural-100">{formatCurrency(action.amount)}</span>
                  )}
                </div>
              </div>
              <Link href={config.href(action.entityId)}>
                <ActionButton variant="ghost" size="sm" className="h-8 px-2 text-xs shrink-0">
                  {config.actionLabel}
                  <ChevronLeft className="w-3 h-3 mr-1" />
                </ActionButton>
              </Link>
            </div>
          );
        })}
        {actions.length === 0 && (
          <div className="text-center py-8 text-neutral-400 text-sm">
            لا توجد مهام معلقة 🎉
          </div>
        )}
      </div>
    </SurfaceCard>
  );
}
