"use client";

import { createContext, useContext, useState } from "react";

import {
  type ReportingGranularity,
  type ReportingPreset,
  type ReportingRange,
  formatReportingRange,
  getDefaultRange,
  getReportingGranularity,
  getPresetRange,
} from "@/features/reporting/lib/reporting-period";

type ReportingPeriodContextValue = {
  preset: ReportingPreset;
  range: ReportingRange;
  granularity: ReportingGranularity;
  rangeLabel: string;
  setPreset: (preset: ReportingPreset) => void;
  setRange: (range: ReportingRange) => void;
};

const ReportingPeriodContext = createContext<ReportingPeriodContextValue | null>(
  null
);

export function ReportingPeriodProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [preset, setPresetState] = useState<ReportingPreset>("30d");
  const [range, setRangeState] = useState<ReportingRange>(() => getPresetRange("30d"));

  function setPreset(nextPreset: ReportingPreset) {
    setPresetState(nextPreset);

    if (nextPreset === "range") {
      setRangeState((currentRange) => currentRange ?? getDefaultRange());
      return;
    }

    setRangeState(getPresetRange(nextPreset));
  }

  function setRange(nextRange: ReportingRange) {
    setPresetState("range");
    setRangeState(nextRange);
  }

  return (
    <ReportingPeriodContext.Provider
      value={{
        preset,
        range,
        granularity: getReportingGranularity(range),
        rangeLabel: formatReportingRange(range, preset),
        setPreset,
        setRange,
      }}
    >
      {children}
    </ReportingPeriodContext.Provider>
  );
}

export function useReportingPeriod() {
  const context = useContext(ReportingPeriodContext);

  if (!context) {
    throw new Error("useReportingPeriod must be used within ReportingPeriodProvider");
  }

  return context;
}
