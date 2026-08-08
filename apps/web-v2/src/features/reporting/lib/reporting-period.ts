import {
  differenceInCalendarDays,
  format,
  subDays,
  subMonths,
} from "date-fns";

export type ReportingPreset = "30d" | "6m" | "12m" | "range";
export type ReportingGranularity = "day" | "month" | "quarter";

export type ReportingRange = {
  from: Date;
  to: Date;
};

export function getPresetRange(preset: Exclude<ReportingPreset, "range">, now = new Date()): ReportingRange {
  if (preset === "30d") {
    return {
      from: subDays(now, 29),
      to: now,
    };
  }

  if (preset === "6m") {
    return {
      from: subMonths(now, 6),
      to: now,
    };
  }

  return {
    from: subMonths(now, 12),
    to: now,
  };
}

export function getDefaultRange(now = new Date()): ReportingRange {
  return {
    from: subDays(now, 29),
    to: now,
  };
}

export function formatReportingRange(
  range: ReportingRange,
  preset: ReportingPreset
) {
  if (preset === "30d") {
    return "Last 30 days";
  }

  if (preset === "6m") {
    return "Last 6 months";
  }

  if (preset === "12m") {
    return "Last 12 months";
  }

  return `${format(range.from, "dd MMM yyyy")} to ${format(range.to, "dd MMM yyyy")}`;
}

export function getReportingGranularity(range: ReportingRange): ReportingGranularity {
  const days = differenceInCalendarDays(range.to, range.from) + 1;

  if (days <= 45) {
    return "day";
  }

  if (days <= 548) {
    return "month";
  }

  return "quarter";
}
