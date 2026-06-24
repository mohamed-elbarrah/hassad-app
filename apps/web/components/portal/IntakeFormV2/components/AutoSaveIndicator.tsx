"use client";

import { Loader2, Save } from "lucide-react";

interface AutoSaveIndicatorProps {
  isAutoSaving: boolean;
  isDirty: boolean;
  lastSavedAt: Date | null;
}

export function AutoSaveIndicator({
  isAutoSaving,
  isDirty,
  lastSavedAt,
}: AutoSaveIndicatorProps) {
  if (!isDirty && !lastSavedAt) return null;

  return (
    <div className="flex items-center gap-2 text-xs text-portal-icon">
      {isAutoSaving ? (
        <>
          <Loader2 className="w-3.5 h-3.5 animate-spin" />
          <span>جاري الحفظ...</span>
        </>
      ) : lastSavedAt ? (
        <>
          <Save className="w-3.5 h-3.5" />
          <span>
            تم الحفظ{" "}
            {lastSavedAt.toLocaleTimeString("ar-SA", {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </span>
        </>
      ) : null}
    </div>
  );
}
