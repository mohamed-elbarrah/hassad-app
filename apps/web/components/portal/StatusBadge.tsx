"use client";

import { CheckCircle2, Clock, Hourglass, RotateCcw, PauseCircle, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";

export type StatusType = "completed" | "in-progress" | "not-started" | "pending" | "revision" | "active" | "on-hold" | "planning" | "cancelled";

const STATUS_CONFIG: Record<
  StatusType,
  { label: string; bg: string; text: string; icon: typeof CheckCircle2 }
> = {
  completed: {
    label: "مكتمل",
    bg: "rgba(14, 213, 137, 0.1)",
    text: "#0ED589",
    icon: CheckCircle2,
  },
  "in-progress": {
    label: "جاري",
    bg: "rgba(248, 175, 1, 0.1)",
    text: "#F8AF01",
    icon: Clock,
  },
  "not-started": {
    label: "لم يبدأ",
    bg: "rgba(18, 25, 54, 0.05)",
    text: "#121936",
    icon: Clock,
  },
  pending: {
    label: "قادمة",
    bg: "rgba(248, 175, 1, 0.1)",
    text: "#F8AF01",
    icon: Hourglass,
  },
  revision: {
    label: "تعديل",
    bg: "rgba(239, 68, 68, 0.1)",
    text: "#EF4444",
    icon: RotateCcw,
  },
  active: {
    label: "نشط",
    bg: "rgba(14, 213, 137, 0.1)",
    text: "#0ED589",
    icon: CheckCircle2,
  },
  "on-hold": {
    label: "معلق",
    bg: "rgba(248, 175, 1, 0.1)",
    text: "#F8AF01",
    icon: PauseCircle,
  },
  planning: {
    label: "تخطيط",
    bg: "rgba(18, 25, 54, 0.05)",
    text: "#121936",
    icon: Clock,
  },
  cancelled: {
    label: "ملغى",
    bg: "rgba(239, 68, 68, 0.1)",
    text: "#EF4444",
    icon: XCircle,
  },
};

/* ── Status Badge ───────────────────────────────────────────────────────
   Exact from source:
   - bg: rgba colors, radius: 12px, text: 16px weight 500
   - Green: rgba(14,213,137,0.1) / #0ED589
   - Yellow: rgba(248,175,1,0.1) / #F8AF01
   - Gray: rgba(18,25,54,0.05) / #121936
─────────────────────────────────────────────────────────────────────────── */
export function StatusBadge({
  status,
  label,
}: {
  status: StatusType;
  label?: string;
}) {
  const config = STATUS_CONFIG[status];
  const Icon = config.icon;

  return (
    <span
      className="inline-flex items-center gap-1"
      style={{
        padding: "8px 16px",
        borderRadius: 12,
        background: config.bg,
        fontSize: 16,
        fontWeight: 500,
        lineHeight: "24px",
        color: config.text,
      }}
    >
      {label ?? config.label}
      <Icon style={{ width: 20, height: 20, color: config.text }} />
    </span>
  );
}
