"use client";

import Link from "next/link";
import {
  AlertTriangle,
  Clock,
  FileText,
  FileSignature,
  MessageSquare,
  ArrowLeft,
} from "lucide-react";
import { SurfaceCard } from "@/components/design-system/SurfaceCard";
import { Skeleton } from "@/components/design-system/Skeleton";
import { cn } from "@/lib/utils";
import type { AlertsData } from "@/features/admin/adminApi";

const CATEGORY_META: Record<string, { icon: any; color: string }> = {
  overdueTasks: { icon: Clock, color: "text-danger-500" },
  agedInvoices: { icon: FileText, color: "text-alert-600" },
  escalatedDisputes: { icon: MessageSquare, color: "text-danger-500" },
  failedWebhooks: { icon: AlertTriangle, color: "text-alert-600" },
  expiringContracts: { icon: FileSignature, color: "text-action-blue" },
  pendingRequests: { icon: FileText, color: "text-action-purple" },
};

const CATEGORY_ORDER = [
  "overdueTasks",
  "escalatedDisputes",
  "agedInvoices",
  "pendingRequests",
  "expiringContracts",
  "failedWebhooks",
];

export function NeedsAttentionCard({
  alerts,
  isLoading,
}: {
  alerts?: AlertsData;
  isLoading: boolean;
}) {
  if (isLoading) {
    return (
      <SurfaceCard title="يحتاج إلى متابعة" icon={AlertTriangle}>
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-16 rounded-xl" />
          ))}
        </div>
      </SurfaceCard>
    );
  }

  if (!alerts) return null;

  const categories = CATEGORY_ORDER
    .map((key) => ({ key, ...CATEGORY_META[key], data: alerts[key] }))
    .filter((c) => c.data?.count > 0);

  if (categories.length === 0) {
    return (
      <SurfaceCard title="يحتاج إلى متابعة" icon={AlertTriangle}>
        <div className="flex flex-col items-center justify-center py-8 text-portal-note-text">
          <AlertTriangle className="size-8 mb-2 opacity-40" />
          <p className="text-sm">كل الأمور على ما يرام — لا توجد تنبيهات</p>
        </div>
      </SurfaceCard>
    );
  }

  return (
    <SurfaceCard title="يحتاج إلى متابعة" icon={AlertTriangle}>
      <div className="space-y-4">
        {categories.map((cat) => (
          <div key={cat.key}>
            <Link
              href={cat.data.link}
              className="flex items-center gap-2 text-sm font-medium text-natural-100 hover:text-secondary-600 mb-2"
            >
              <cat.icon className={cn("size-4", cat.color)} />
              <span>{cat.data.label}</span>
              <span className="mr-auto text-xs text-portal-note-text">
                {cat.data.count}
              </span>
              <ArrowLeft className="size-3.5 text-portal-note-text" />
            </Link>

            {cat.data.items?.length > 0 && (
              <div className="space-y-1 mr-6">
                {cat.data.items.slice(0, 3).map((item: any, idx: number) => (
                  <Link
                    key={item.id ?? idx}
                    href={`${cat.data.link.split("?")[0]}/${item.id}`}
                    className="block rounded-xl border border-portal-divider bg-badge-gray-bg/30 px-3 py-2 text-xs text-portal-note-text hover:border-secondary-300 hover:bg-badge-gray-bg/60 transition-all"
                  >
                    {item.title ?? item.invoiceNumber ?? item.companyName ?? item.ticketNumber ?? "—"}
                  </Link>
                ))}
                {cat.data.items.length > 3 && (
                  <p className="text-xs text-portal-note-text pr-3">
                    + {cat.data.items.length - 3} أخرى
                  </p>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </SurfaceCard>
  );
}
