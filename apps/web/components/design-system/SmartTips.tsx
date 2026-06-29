"use client";

import { Wallet, AlertCircle, Lightbulb } from "lucide-react";
import type { ReportSmartTip } from "@/features/portal/portalApi";
import { cn } from "@/lib/utils";

const TIP_ICONS: Record<string, React.ElementType> = {
  budget: Wallet,
  warning: AlertCircle,
  insight: Lightbulb,
};

const TIP_ICON_BG: Record<string, string> = {
  budget: "bg-alert-100",
  warning: "bg-danger-100",
  insight: "bg-success-100",
};

const TIP_ICON_COLOR: Record<string, string> = {
  budget: "text-alert-600",
  warning: "text-danger-600",
  insight: "text-success-600",
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
              className={cn(
                "shrink-0 w-9 h-9 rounded-full flex items-center justify-center",
                TIP_ICON_BG[tip.type] || "bg-portal-bg",
              )}
            >
              <Icon
                size={18}
                className={TIP_ICON_COLOR[tip.type] || "text-neutral-500"}
              />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-secondary-500">
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
