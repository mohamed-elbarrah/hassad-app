"use client";

import { useState } from "react";
import type { ReportTopCampaign } from "@/features/portal/portalApi";

function fmtCompact(n: number): string {
  if (n >= 1_000_000)
    return (n / 1_000_000).toFixed(1).replace(/\.0$/, "") + "M";
  if (n >= 1_000) return (n / 1_000).toFixed(1).replace(/\.0$/, "") + "K";
  return n.toLocaleString("ar-SA-u-nu-latn");
}

type SortKey = "conversions" | "conversionRate" | "name";

interface TopCampaignsTableProps {
  campaigns: ReportTopCampaign[];
}

export function TopCampaignsTable({ campaigns }: TopCampaignsTableProps) {
  const [sortKey, setSortKey] = useState<SortKey>("conversions");
  const [sortAsc, setSortAsc] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const toggleSelect = (id: string) => {
    const next = new Set(selected);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelected(next);
  };

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortAsc(!sortAsc);
    } else {
      setSortKey(key);
      setSortAsc(false);
    }
  };

  const sorted = [...campaigns]
    .sort((a, b) => {
      const aVal = a[sortKey];
      const bVal = b[sortKey];
      const diff =
        typeof aVal === "number" && typeof bVal === "number"
          ? bVal - aVal
          : String(aVal).localeCompare(String(bVal));
      return sortAsc ? -diff : diff;
    })
    .slice(0, 5);

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-3 px-1">
        <div className="text-xs text-muted-foreground">عرض الكل</div>
      </div>

      <div className="flex items-center gap-1 text-[10px] text-neutral-300 px-2 py-1 bg-neutral-50 rounded-lg">
        <button
          className={`flex-1 text-center py-1 rounded ${sortKey === "conversions" ? "bg-white shadow-sm text-natural-100 font-medium" : ""}`}
          onClick={() => handleSort("conversions")}
        >
          التحويلات {sortKey === "conversions" ? (sortAsc ? "↑" : "↓") : ""}
        </button>
        <button
          className={`flex-1 text-center py-1 rounded ${sortKey === "conversionRate" ? "bg-white shadow-sm text-natural-100 font-medium" : ""}`}
          onClick={() => handleSort("conversionRate")}
        >
          CTR {sortKey === "conversionRate" ? (sortAsc ? "↑" : "↓") : ""}
        </button>
        <button
          className={`flex-1 text-center py-1 rounded ${sortKey === "name" ? "bg-white shadow-sm text-natural-100 font-medium" : ""}`}
          onClick={() => handleSort("name")}
        >
          إعلان {sortKey === "name" ? (sortAsc ? "↑" : "↓") : ""}
        </button>
      </div>

      <div className="flex flex-col">
        {sorted.map((c) => {
          const ctr =
            c.clicks > 0
              ? ((c.clicks / c.impressions) * 100).toFixed(1)
              : "0.0";
          return (
            <div
              key={c.id}
              className="flex items-center gap-2 py-2.5 border-b last:border-0 px-1"
            >
              <div className="flex-1 text-xs truncate">{c.name}</div>
                  <div className="text-xs text-neutral-300 w-16 text-center">
                {ctr}%
              </div>
              <div className="text-xs text-natural-100 w-16 text-center font-medium">
                {fmtCompact(c.conversions)}
              </div>
              <button
                onClick={() => toggleSelect(c.id)}
                className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 ${
                  selected.has(c.id)
                    ? "bg-[#121936] border-[#121936]"
                    : "border-neutral-300"
                }`}
              >
                {selected.has(c.id) && (
                  <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                    <path
                      d="M1.5 5.5L3.5 7.5L8.5 2.5"
                      stroke="white"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                )}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
