"use client";

import { CurrencyDisplay } from "@/components/design-system/CurrencyDisplay";
import { ProgressBar } from "@/components/design-system/ProgressBar";
import { PLATFORM_ICON_BG, platformLabel } from "@/lib/utils/campaign-constants";
import { Megaphone } from "lucide-react";
import { cn } from "@/lib/utils";
import type { PortalCampaign } from "@/features/portal/portalApi";
import { CampaignStatusPill } from "./CampaignStatusPill";
import { formatShortDateLong, budgetProgress } from "@/lib/format";

/**
 * Cells-only renderer for the campaigns queue. The <tr> chrome
 * is owned by `<DataTable>`; this only emits <td>s.
 */
export function renderCampaignRowCells(
  campaign: PortalCampaign,
): React.ReactNode[] {
  const a = campaign.analytics;
  const progressPct =
    budgetProgress(campaign.budgetSpent, campaign.budgetTotal) * 100;
  const period = formatPeriod(campaign.startDate, campaign.endDate);
  const platform = platformLabel(campaign.platform);
  const platformIconClass =
    PLATFORM_ICON_BG[campaign.platform] ??
    "bg-badge-gray-bg text-secondary-500";

  return [
    <td key="name" className="px-5 py-3.5 align-middle">
      <div className="flex items-center gap-3 min-w-0">
        <span
          className={cn(
            "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg",
            platformIconClass,
          )}
          aria-hidden="true"
        >
          <Megaphone className="h-4 w-4" />
        </span>
        <div className="flex flex-col gap-0.5 min-w-0">
          <span className="text-sm font-semibold text-natural-100 truncate max-w-[220px]">
            {campaign.name}
          </span>
          <span className="text-[11px] text-portal-note-text">{platform}</span>
        </div>
      </div>
    </td>,
    <td key="status" className="px-5 py-3.5 align-middle">
      <CampaignStatusPill status={campaign.status} />
    </td>,
    <td key="period" className="px-5 py-3.5 align-middle text-[12.5px] text-portal-note-text tabular-nums">
      {period}
    </td>,
    <td key="impressions" className="px-5 py-3.5 align-middle text-start">
      <KpiCell value={formatNumber(a.impressions)} />
    </td>,
    <td key="clicks" className="px-5 py-3.5 align-middle text-start">
      <KpiCell value={formatNumber(a.clicks)} />
    </td>,
    <td key="conversions" className="px-5 py-3.5 align-middle text-start">
      <KpiCell value={formatNumber(a.conversions)} />
    </td>,
    <td key="ctr" className="px-5 py-3.5 align-middle text-start">
      <KpiCell value={a.ctr ? `${a.ctr.toFixed(2)}%` : "—"} />
    </td>,
    <td key="roas" className="px-5 py-3.5 align-middle text-start">
      <KpiCell
        value={a.roas ? `${a.roas.toFixed(2)}x` : "—"}
        tone={
          a.roas && a.roas >= 1
            ? "success"
            : a.roas
              ? "danger"
              : "muted"
        }
      />
    </td>,
    <td key="budget" className="px-5 py-3.5 align-middle min-w-[160px]">
      <BudgetCell
        spent={campaign.budgetSpent}
        total={campaign.budgetTotal}
        progressPct={progressPct}
      />
    </td>,
  ];
}

// Hook wrapper so useCurrency's rules-of-hooks aren't violated
// when the row is rendered inside DataTable's renderCells.
function KpiCell({
  value,
  tone = "default",
}: {
  value: string;
  tone?: "default" | "success" | "danger" | "muted";
}) {
  const colorClass =
    tone === "success"
      ? "text-success-700"
      : tone === "danger"
        ? "text-danger-700"
        : tone === "muted"
          ? "text-portal-note-text"
          : "text-natural-100";
  return (
    <span
      className={cn(
        "inline-flex items-center justify-start w-full tabular-nums",
        colorClass,
      )}
    >
      {value}
    </span>
  );
}

function BudgetCell({
  spent,
  total,
  progressPct,
}: {
  spent: number;
  total: number;
  progressPct: number;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-baseline justify-start gap-1.5 text-[12.5px] tabular-nums">
        <span className="font-semibold text-natural-100">
          <CurrencyDisplay amount={spent} size="sm" />
        </span>
        <span className="text-portal-note-text">/</span>
        <span className="text-portal-note-text">
          <CurrencyDisplay amount={total} size="sm" />
        </span>
      </div>
      <ProgressBar
        value={progressPct}
        variant={
          progressPct >= 90
            ? "danger"
            : progressPct >= 70
              ? "warning"
              : "default"
        }
        className="h-1.5"
      />
    </div>
  );
}

// Single helper so every numeric KPI cell goes through the same
// Arabic-locale formatter without each call site re-importing
// useCurrency just for `fmtNumber`.
function formatNumber(n: number | undefined): string {
  if (n == null) return "—";
  try {
    return new Intl.NumberFormat("ar-SA-u-nu-latn").format(n);
  } catch {
    return String(n);
  }
}

function formatPeriod(
  start?: string | null,
  end?: string | null,
): string {
  const s = formatShortDateLong(start);
  const e = formatShortDateLong(end);
  if (s === "—" && e === "—") return "—";
  if (s !== "—" && e !== "—") return `${s} — ${e}`;
  return s !== "—" ? s : e;
}