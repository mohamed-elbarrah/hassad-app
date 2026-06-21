import type { PeriodGoal } from "@hassad/shared";

/** Short Arabic date: "12 يونيو" */
export function formatShortDate(dateStr: string | Date): string {
  return new Date(dateStr).toLocaleDateString("ar-SA-u-nu-latn", {
    day: "numeric",
    month: "short",
  });
}

/** Full Arabic date: "12 يونيو 2026" */
export function formatDate(dateStr: string | Date): string {
  return new Date(dateStr).toLocaleDateString("ar-SA-u-nu-latn", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

/** Date + time: "12 يونيو 2026 - 11:00 ص" */
export function formatDateTime(dateStr: string | Date): string {
  return new Date(dateStr).toLocaleDateString("ar-SA-u-nu-latn", {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

/** Whole days from now until `endDate` (can be negative). */
export function getDaysRemaining(endDate: string | Date): number {
  const end = new Date(endDate).getTime();
  const now = Date.now();
  return Math.ceil((end - now) / (1000 * 60 * 60 * 24));
}

/** Human-readable file size: "1.2 MB" */
export function formatFileSize(bytes: number): string {
  if (!bytes) return "0 B";
  const units = ["B", "KB", "MB", "GB"];
  const i = Math.min(units.length - 1, Math.floor(Math.log(bytes) / Math.log(1024)));
  const value = bytes / Math.pow(1024, i);
  return `${value.toFixed(value >= 10 || i === 0 ? 0 : 1)} ${units[i]}`;
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