"use client";

import { useGetClientStrategiesQuery } from "@/features/portal/portalApi";
import {
  MARKETING_STRATEGY_STATUS_AR,
  MarketingStrategyStatus,
} from "@hassad/shared";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
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

const STATUS_CLASSES: Record<
  string,
  { icon: string; badge: string }
> = {
  DRAFT: {
    icon: "bg-neutral-100 text-neutral-600",
    badge: "border-neutral-200 bg-neutral-100 text-neutral-600",
  },
  SENT: {
    icon: "bg-info/10 text-info",
    badge: "border-info/20 bg-info/10 text-info",
  },
  APPROVED: {
    icon: "bg-success-100 text-success-600",
    badge: "border-success-200 bg-success-100 text-success-600",
  },
  REVISION_REQUESTED: {
    icon: "bg-warning-100 text-warning-600",
    badge: "border-warning-200 bg-warning-100 text-warning-600",
  },
  REJECTED: {
    icon: "bg-danger-100 text-danger-600",
    badge: "border-danger-200 bg-danger-100 text-danger-600",
  },
};

export default function MarketingStrategiesPage() {
  const { data: strategies = [], isLoading } = useGetClientStrategiesQuery();

  if (isLoading) {
    return (
      <main dir="rtl" className="flex flex-col gap-6 p-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-32 w-full rounded-xl" />
      </main>
    );
  }

  return (
    <main dir="rtl" className="flex flex-col gap-6 p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">الدراسات التسويقية</h1>
      </div>

      {strategies.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground">
              لا توجد دراسات تسويقية حالياً
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="flex flex-col gap-4">
          {strategies.map((strategy) => {
            const statusLabel =
              MARKETING_STRATEGY_STATUS_AR[
                strategy.status as keyof typeof MARKETING_STRATEGY_STATUS_AR
              ] ?? strategy.status;

            const iconClass =
              STATUS_CLASSES[strategy.status ?? MarketingStrategyStatus.DRAFT]
                ?.icon ?? "bg-neutral-100 text-neutral-600";
            const badgeClass =
              STATUS_CLASSES[strategy.status ?? MarketingStrategyStatus.DRAFT]
                ?.badge ??
              "border-neutral-200 bg-neutral-100 text-neutral-600";

            return (
              <Link
                key={strategy.id}
                href={`/portal/marketing-strategies/${strategy.id}`}
              >
                <Card className="cursor-pointer transition-colors hover:border-primary/30">
                  <CardContent className="flex items-center gap-4 p-4">
                    <div
                      className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full ${iconClass}`}
                    >
                      {(() => {
                        const Icon =
                          STATUS_ICON[strategy.status] ?? FileText;
                        return <Icon className="h-5 w-5" />;
                      })()}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-medium truncate">
                        {strategy.fileName}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {strategy.task?.project?.name ?? "—"} ·{" "}
                        {strategy.task?.title ?? "—"}
                      </p>
                    </div>
                    <Badge variant="outline" className={badgeClass}>
                      {statusLabel}
                    </Badge>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </main>
  );
}
