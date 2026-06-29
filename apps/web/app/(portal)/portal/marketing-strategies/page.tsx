"use client";

import { useState } from "react";
import {
  useGetClientStrategiesQuery,
  useApproveStrategyMutation,
  useRequestStrategyRevisionMutation,
} from "@/features/portal/portalApi";
import { MARKETING_STRATEGY_STATUS_AR, MarketingStrategyStatus } from "@hassad/shared";
import { SurfaceCard } from "@/components/design-system/SurfaceCard";
import { ActionButton } from "@/components/design-system/ActionButton";
import { StatusBadge } from "@/components/design-system/StatusBadge";
import { IconCircle } from "@/components/design-system/IconCircle";
import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import {
  FileText,
  CheckCircle2,
  Clock,
  AlertCircle,
  XCircle,
} from "lucide-react";

const STATUS_ICON: Record<string, LucideIcon> = {
  DRAFT: FileText,
  SENT: Clock,
  APPROVED: CheckCircle2,
  REVISION_REQUESTED: AlertCircle,
  REJECTED: XCircle,
};

const STATUS_COLOR: Record<string, "blue" | "amber" | "green" | "red" | "gray"> = {
  DRAFT: "gray",
  SENT: "amber",
  APPROVED: "green",
  REVISION_REQUESTED: "red",
  REJECTED: "red",
};

export default function MarketingStrategiesPage() {
  const { data: strategies = [], isLoading } = useGetClientStrategiesQuery();

  if (isLoading) {
    return (
      <div className="space-y-4 p-6">
        <div className="h-8 bg-muted rounded w-48 animate-pulse" />
        <div className="h-32 bg-muted rounded animate-pulse" />
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6" dir="rtl">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">الدراسات التسويقية</h1>
      </div>

      {strategies.length === 0 ? (
        <SurfaceCard>
          <div className="p-8 text-center">
            <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground">
              لا توجد دراسات تسويقية حالياً
            </p>
          </div>
        </SurfaceCard>
      ) : (
        <div className="space-y-4">
          {strategies.map((strategy) => {
            const statusLabel =
              MARKETING_STRATEGY_STATUS_AR[strategy.status as keyof typeof MARKETING_STRATEGY_STATUS_AR] ??
              strategy.status;
            const color = STATUS_COLOR[strategy.status] ?? "gray";

            return (
              <Link
                key={strategy.id}
                href={`/portal/marketing-strategies/${strategy.id}`}
              >
                <SurfaceCard className="cursor-pointer hover:border-primary/30 transition-colors">
                  <div className="p-4 flex items-center gap-4">
                    <IconCircle
                      icon={STATUS_ICON[strategy.status] ?? FileText}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">
                        {strategy.fileName}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {strategy.task?.project?.name ?? "—"} ·{" "}
                        {strategy.task?.title ?? "—"}
                      </p>
                    </div>
                    <StatusBadge status={strategy.status ?? MarketingStrategyStatus.DRAFT} label={statusLabel} />
                  </div>
                </SurfaceCard>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}