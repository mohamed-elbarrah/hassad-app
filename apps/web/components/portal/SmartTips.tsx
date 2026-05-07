"use client";

import { Wallet, AlertCircle, Lightbulb } from "lucide-react";
import type { ReportSmartTip } from "@/features/portal/portalApi";

const TIP_ICONS: Record<string, React.ElementType> = {
  budget: Wallet,
  warning: AlertCircle,
  insight: Lightbulb,
};

const TIP_ICON_BG: Record<string, string> = {
  budget: "#FFF7ED",
  warning: "#FEF2F2",
  insight: "#F0FDF4",
};

const TIP_ICON_COLOR: Record<string, string> = {
  budget: "#e7be52",
  warning: "#F43F5E",
  insight: "#10B981",
};

interface SmartTipsProps {
  tips: ReportSmartTip[];
}

export function SmartTips({ tips }: SmartTipsProps) {
  if (tips.length === 0) return null;

  return (
    <div className="flex flex-col gap-3">
      {tips.map((tip, i) => {
        const Icon = TIP_ICONS[tip.type] || Lightbulb;
        return (
          <div key={i} className="flex items-start gap-3">
            <div
              className="shrink-0 w-9 h-9 rounded-full flex items-center justify-center"
              style={{ backgroundColor: TIP_ICON_BG[tip.type] || "#f9fafb" }}
            >
              <Icon
                size={18}
                style={{ color: TIP_ICON_COLOR[tip.type] || "#6B7280" }}
              />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold" style={{ color: "#121936" }}>
                {tip.title}
              </p>
              <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
                {tip.description}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}