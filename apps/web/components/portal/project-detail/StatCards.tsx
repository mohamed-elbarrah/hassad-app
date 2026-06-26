"use client";

import { Calendar, FileText, Folder, Target, Clock } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { PortalPeriodStats } from "@/features/portal/portalApi";
import { cn } from "@/lib/utils";
import { formatDateTime } from "./helpers";

type StatColor = "emerald" | "blue" | "violet" | "amber";

const COLOR_MAP: Record<StatColor, string> = {
  emerald: "bg-emerald-50 text-emerald-600",
  blue: "bg-blue-50 text-blue-600",
  violet: "bg-violet-50 text-violet-600",
  amber: "bg-amber-50 text-amber-600",
};

function StatCard({
  icon: Icon,
  value,
  label,
  subtext,
  color,
}: {
  icon: LucideIcon;
  value: string;
  label: string;
  subtext?: string;
  color: StatColor;
}) {
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-portal-card-border bg-natural-0 p-4">
      <div
        className={cn(
          "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl",
          COLOR_MAP[color],
        )}
      >
        <Icon className="size-5" />
      </div>
      <div className="min-w-0">
        <p className="text-lg font-bold text-natural-100">{value}</p>
        <p className="text-xs text-portal-note-text">{label}</p>
        {subtext && (
          <p className="mt-0.5 text-[10px] text-portal-note-text">{subtext}</p>
        )}
      </div>
    </div>
  );
}

interface StatCardsProps {
  stats: PortalPeriodStats;
}

/** The four summary stat cards for the selected period. */
export function StatCards({ stats }: StatCardsProps) {
  const nextMeeting = stats.nextMeeting;
  const daysToMeeting = nextMeeting
    ? Math.ceil(
        (new Date(nextMeeting.scheduledAt).getTime() - Date.now()) /
          (1000 * 60 * 60 * 24),
      )
    : null;

  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4" dir="rtl">
      <StatCard
        icon={Target}
        value={`${stats.goalsCompleted}/${stats.goalsTotal}`}
        label="الأهداف"
        subtext="مكتملة"
        color="emerald"
      />
      <StatCard
        icon={FileText}
        value={`${stats.reportsCount}`}
        label="التقارير"
        subtext="تقارير الفترة"
        color="blue"
      />
      <StatCard
        icon={Folder}
        value={`${stats.filesCount}`}
        label="الملفات"
        subtext="مرفق"
        color="violet"
      />
      <StatCard
        icon={nextMeeting ? Calendar : Clock}
        value={
          nextMeeting
            ? daysToMeeting !== null && daysToMeeting >= 0
              ? `${daysToMeeting} يوم`
              : "اليوم"
            : "—"
        }
        label="الاجتماع القادم"
        subtext={
          nextMeeting ? formatDateTime(nextMeeting.scheduledAt) : undefined
        }
        color="amber"
      />
    </div>
  );
}
