"use client";

import Link from "next/link";
import { StatusBadge } from "@/components/design-system/StatusBadge";
import { formatCurrency, formatNumber } from "@/lib/format";
import { ArrowUpRight, TrendingDown, TrendingUp, Minus } from "lucide-react";

interface CampaignWithMetrics {
  id: string;
  name: string;
  platform: string;
  status: string;
  budgetTotal: number;
  budgetSpent: number;
  impressions: number;
  clicks: number;
  conversions: number;
  revenue: number;
  roas: number;
  ctr: number;
  cpa: number;
  cpc: number;
  needsOptimization: boolean;
  taskId: string;
  taskTitle: string;
  clientName?: string;
}

import {
  CAMPAIGN_STATUS_LABELS,
  CAMPAIGN_STATUS_BADGE,
  PLATFORM_LABELS,
  PLATFORM_DOT,
} from "@/lib/utils/campaign-constants";

function RoasIndicator({ roas }: { roas: number }) {
  if (roas >= 2)
    return (
      <span className="inline-flex items-center gap-1 text-success-600 text-xs font-medium">
        <TrendingUp className="w-3 h-3" />
        {roas.toFixed(1)}x
      </span>
    );
  if (roas >= 1)
    return (
      <span className="inline-flex items-center gap-1 text-neutral-300 text-xs font-medium">
        <Minus className="w-3 h-3" />
        {roas.toFixed(1)}x
      </span>
    );
  if (roas > 0)
    return (
      <span className="inline-flex items-center gap-1 text-danger-600 text-xs font-medium">
        <TrendingDown className="w-3 h-3" />
        {roas.toFixed(1)}x
      </span>
    );
  return <span className="text-neutral-300 text-xs">—</span>;
}

export function CampaignPerformanceList({
  campaigns,
}: {
  campaigns: CampaignWithMetrics[];
}) {
  const sorted = [...campaigns].sort((a, b) => {
    // Active first, then by ROAS desc
    if (a.status === "ACTIVE" && b.status !== "ACTIVE") return -1;
    if (b.status === "ACTIVE" && a.status !== "ACTIVE") return 1;
    return b.roas - a.roas;
  });

  const topCampaigns = sorted.slice(0, 6);

  return (
    <div className="space-y-3">
      {/* Header row (desktop) */}
      <div className="hidden md:grid md:grid-cols-12 gap-3 px-4 text-xs text-neutral-300 font-medium">
        <div className="col-span-4">الحملة</div>
        <div className="col-span-2 text-center">الميزانية</div>
        <div className="col-span-1 text-center">ROAS</div>
        <div className="col-span-1 text-center">CTR</div>
        <div className="col-span-2 text-center">التحويلات</div>
        <div className="col-span-1 text-center">الحالة</div>
        <div className="col-span-1 text-left"></div>
      </div>

      {topCampaigns.map((c) => {
        const budgetPct =
          c.budgetTotal > 0
            ? Math.min(100, Math.round((c.budgetSpent / c.budgetTotal) * 100))
            : 0;

        return (
          <Link
            key={c.id}
            href={`/dashboard/marketing/tasks/${c.taskId}`}
            className="group flex flex-col md:grid md:grid-cols-12 gap-3 p-4 rounded-xl border border-portal-card-border hover:border-secondary-300 hover:shadow-sm transition-all"
          >
            {/* Campaign name + platform */}
            <div className="col-span-4 min-w-0">
              <div className="flex items-center gap-2">
                <span
                  className={`inline-block w-2 h-2 rounded-full ${
                    PLATFORM_DOT[c.platform] || "bg-neutral-300"
                  }`}
                />
                <div className="min-w-0">
                  <h4 className="font-medium text-sm truncate group-hover:text-secondary-500 transition-colors">
                    {c.name}
                  </h4>
                  <p className="text-[11px] text-neutral-300">
                    {PLATFORM_LABELS[c.platform] || c.platform}
                    {c.clientName && ` · ${c.clientName}`}
                  </p>
                </div>
              </div>
            </div>

            {/* Budget bar */}
            <div className="col-span-2">
              <div className="flex items-center justify-between md:justify-center gap-2">
                <span className="text-xs font-medium md:hidden">
                  الميزانية:
                </span>
                <div className="w-full max-w-[120px]">
                  <div className="flex items-center justify-between text-[10px] text-neutral-300 mb-0.5">
                    <span>{budgetPct}%</span>
                    <span>{formatCurrency(c.budgetSpent)}</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-neutral-50 overflow-hidden">
                    <div
                      className={`h-full rounded-full ${
                        budgetPct > 90 ? "bg-danger-500" : "bg-secondary-500"
                      }`}
                      style={{ width: `${budgetPct}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* ROAS */}
            <div className="col-span-1 flex md:justify-center items-center gap-2">
              <span className="text-xs font-medium md:hidden">ROAS:</span>
              <RoasIndicator roas={c.roas} />
            </div>

            {/* CTR */}
            <div className="col-span-1 flex md:justify-center items-center gap-2">
              <span className="text-xs font-medium md:hidden">CTR:</span>
              <span className="text-xs font-medium">
                {c.ctr > 0 ? `${c.ctr.toFixed(1)}%` : "—"}
              </span>
            </div>

            {/* Conversions */}
            <div className="col-span-2 flex md:justify-center items-center gap-2">
              <span className="text-xs font-medium md:hidden">التحويلات:</span>
              <div className="text-center">
                <span className="text-xs font-medium">
                  {formatNumber(c.conversions)}
                </span>
                {c.cpa > 0 && (
                  <p className="text-[10px] text-neutral-300">
                    CPA: {formatCurrency(c.cpa)}
                  </p>
                )}
              </div>
            </div>

            {/* Status */}
            <div className="col-span-1 flex md:justify-center items-center gap-2">
              <span className="text-xs font-medium md:hidden">الحالة:</span>
              <StatusBadge
                status={CAMPAIGN_STATUS_BADGE[c.status] || "PENDING"}
                label={CAMPAIGN_STATUS_LABELS[c.status] || c.status}
                className="text-[10px]"
              />
            </div>

            {/* Arrow */}
            <div className="col-span-1 hidden md:flex items-center justify-end">
              <ArrowUpRight className="w-4 h-4 text-secondary-500 opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
          </Link>
        );
      })}

      {campaigns.length > 6 && (
        <div className="text-center pt-2">
          <span className="text-xs text-neutral-300">
            +{campaigns.length - 6} حملة أخرى
          </span>
        </div>
      )}
    </div>
  );
}
