import type { PeriodGoal } from "@hassad/shared";
export { formatFileSize } from "@/lib/format";

/** Arabic month names ordered Jan → Dec — used by timezone-safe formatters
 *  below so we never depend on `Intl.DateTimeFormat` interpreting UTC
 *  midnight in the user's local timezone (audit issue #5). */
const ARABIC_MONTHS_SHORT = [
  "يناير",
  "فبراير",
  "مارس",
  "أبريل",
  "مايو",
  "يونيو",
  "يوليو",
  "أغسطس",
  "سبتمبر",
  "أكتوبر",
  "نوفمبر",
  "ديسمبر",
];

/** Parse a YYYY-MM-DD (or full ISO) string into its calendar date components
 *  WITHOUT timezone shift. Falls back to `new Date(...)` for non-ISO inputs.
 *  Returns `{ year, month (0-11), day }`. */
function parseCalendarDate(input: string | Date): {
  year: number;
  month: number;
  day: number;
} {
  if (typeof input === "string") {
    const isoMatch = /^(\d{4})-(\d{2})-(\d{2})/.exec(input);
    if (isoMatch) {
      return {
        year: Number(isoMatch[1]),
        month: Number(isoMatch[2]) - 1,
        day: Number(isoMatch[3]),
      };
    }
  }
  const d = new Date(input);
  return { year: d.getFullYear(), month: d.getMonth(), day: d.getDate() };
}

/** Short Arabic date: "12 يونيو" — timezone-safe (uses the calendar date
 *  embedded in the ISO string, not the local-time interpretation). */
export function formatShortDate(dateStr: string | Date): string {
  const { day, month } = parseCalendarDate(dateStr);
  return `${day} ${ARABIC_MONTHS_SHORT[month]}`;
}

/** Full Arabic date: "12 يونيو 2026" — timezone-safe. */
export function formatDate(dateStr: string | Date): string {
  const { year, month, day } = parseCalendarDate(dateStr);
  return `${day} ${ARABIC_MONTHS_SHORT[month]} ${year}`;
}

/** Date + time: "12 يونيو 2026 - 11:00 ص" — uses the user's local time
 *  because the time portion IS timezone-sensitive and meaningful.
 */
export function formatDateTime(dateStr: string | Date): string {
  const { year, month, day } = parseCalendarDate(dateStr);
  const d = new Date(dateStr);
  const time = d.toLocaleTimeString("ar-SA-u-nu-latn", {
    hour: "numeric",
    minute: "2-digit",
  });
  return `${day} ${ARABIC_MONTHS_SHORT[month]} ${year} - ${time}`;
}

/** Whole days from now until `endDate` (can be negative). Compares the
 *  end-of-day timestamp of the calendar date against now so the result is
 *  consistent regardless of the user's timezone. */
export function getDaysRemaining(endDate: string | Date): number {
  const { year, month, day } = parseCalendarDate(endDate);
  // Build a UTC timestamp for the END of that calendar day (23:59:59.999)
  // so a period ending today still has ≥0 days remaining until midnight.
  const end = Date.UTC(year, month, day, 23, 59, 59, 999);
  const now = Date.now();
  return Math.ceil((end - now) / (1000 * 60 * 60 * 24));
}

export type GoalStatus = PeriodGoal["status"];

export const GOAL_STATUS_CONFIG: Record<
  GoalStatus,
  { badge: string; barColor: string; label: string }
> = {
  done: {
    badge: "bg-emerald-100 text-emerald-700",
    barColor: "bg-emerald-500",
    label: "مكتمل",
  },
  in_progress: {
    badge: "bg-secondary-100 text-secondary-700",
    barColor: "bg-secondary-500",
    label: "قيد التنفيذ",
  },
  pending: {
    badge: "bg-neutral-100 text-neutral-500",
    barColor: "bg-neutral-300",
    label: "معلق",
  },
};
