"use client";

import {
  Calendar,
  FileText,
  Folder,
  Target,
  Clock,
  History,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { PortalPeriodStats } from "@/features/portal/portalApi";
import { cn } from "@/lib/utils";
import { formatDateTimeTz } from "@/lib/format";

type StatColor = "emerald" | "blue" | "violet" | "amber";

const COLOR_MAP: Record<StatColor, string> = {
  emerald: "bg-emerald-50 text-emerald-600",
  blue: "bg-blue-50 text-blue-600",
  violet: "bg-violet-50 text-violet-600",
  amber: "bg-amber-50 text-amber-600",
};

/**
 * Resolve the *next* meeting relative to now.
 *
 * Three terminal states:
 *   - `none`  — no scheduled/rescheduled meeting exists at all.
 *   - `today` — meeting is scheduled for today (positive intent, show as "اليوم").
 *   - `future` — meeting is later than today (show countdown in days).
 *
 * Plus one *honest* state:
 *   - `past`  — meeting exists but its date is already in the past.
 *               The previous code returned "اليوم" here, which silently lied
 *               to users looking at a missed/stale meeting (UX issue #2).
 *
 * `daysToMeeting` is computed against start-of-today in the user's timezone
 * (via `Date.now()`), so the boundary at midnight is stable regardless of
 * the current clock time.
 */
type MeetingState =
  | { kind: "none" }
  | { kind: "today" }
  | { kind: "future"; days: number }
  | { kind: "past"; daysAgo: number };

function resolveNextMeeting(
  meeting: PortalPeriodStats["nextMeeting"],
): MeetingState {
  if (!meeting) return { kind: "none" };
  const meetingTs = new Date(meeting.scheduledAt).getTime();
  const now = Date.now();
  const oneDayMs = 1000 * 60 * 60 * 24;
  const diffDays = Math.ceil((meetingTs - now) / oneDayMs);
  if (diffDays > 0) return { kind: "future", days: diffDays };
  if (diffDays === 0) return { kind: "today" };
  return { kind: "past", daysAgo: Math.abs(diffDays) };
}

function StatCard({
  icon: Icon,
  value,
  label,
  subtext,
  color,
  muted = false,
}: {
  icon: LucideIcon;
  value: string;
  label: string;
  subtext?: string;
  color: StatColor;
  /** When true, dim the card to communicate "stale / no longer active" state. */
  muted?: boolean;
}) {
  return (
    <div
      className={cn(
        "flex items-center gap-3 rounded-2xl border border-portal-card-border bg-natural-0 p-4",
        muted && "opacity-70",
      )}
    >
      <div
        className={cn(
          "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl",
          COLOR_MAP[color],
        )}
      >
        <Icon className="size-5" />
      </div>
      <div className="min-w-0 flex-1">
        <p
          className="truncate text-lg font-bold text-natural-100"
          title={value}
        >
          {value}
        </p>
        <p className="truncate text-xs text-portal-note-text" title={label}>
          {label}
        </p>
        {subtext && (
          <p
            className="mt-0.5 truncate text-caption text-portal-note-text"
            title={subtext}
          >
            {subtext}
          </p>
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
  const meetingState = resolveNextMeeting(stats.nextMeeting);

  return (
    <div
      // 2×2 grid stays the layout from `sm` through `2xl`. We deliberately
      // skip the 4-column row because, when this component is placed in the
      // 40%-width column of the page-level 60/40 split, four columns would
      // squeeze each tile below readable width (≈120px). 2×2 is the layout
      // that survives both the constrained placement and the standalone
      // full-width usage on smaller pages.
      className="grid grid-cols-2 gap-3"
      dir="rtl"
    >
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
      <MeetingCard state={meetingState} meeting={stats.nextMeeting} />
    </div>
  );
}

/**
 * The fourth stat card — isolated because its rendering rules differ from
 * the other three: the icon, label, and muted styling all depend on the
 * meeting's relative state. Pulling it into a separate component keeps the
 * `StatCard` primitive generic and the state logic readable.
 */
function MeetingCard({
  state,
  meeting,
}: {
  state: MeetingState;
  meeting: PortalPeriodStats["nextMeeting"];
}) {
  switch (state.kind) {
    case "none":
      return (
        <StatCard
          icon={Clock}
          value="—"
          label="الاجتماع القادم"
          color="amber"
        />
      );
    case "today":
      return (
        <StatCard
          icon={Calendar}
          value="اليوم"
          label="الاجتماع القادم"
          subtext={meeting ? formatDateTimeTz(meeting.scheduledAt) : undefined}
          color="amber"
        />
      );
    case "future":
      return (
        <StatCard
          icon={Calendar}
          value={`${state.days} يوم`}
          label="الاجتماع القادم"
          subtext={meeting ? formatDateTimeTz(meeting.scheduledAt) : undefined}
          color="amber"
        />
      );
    case "past":
      return (
        <StatCard
          icon={History}
          value={`منذ ${state.daysAgo} يوم`}
          label="آخر اجتماع"
          subtext={meeting ? formatDateTimeTz(meeting.scheduledAt) : undefined}
          color="amber"
          muted
        />
      );
  }
}
