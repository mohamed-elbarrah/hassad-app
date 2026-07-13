"use client";

import { useState, useEffect } from "react";
import { RefreshCw, AlertTriangle, Loader2 } from "lucide-react";
import { Checkbox } from "@/components/design-system/Checkbox";
import { cn } from "@/lib/utils";

interface ModelPickerProps {
  providerId?: string | null;
  providerType: string;
  apiKey: string;
  baseUrl?: string;
  selected: string[];
  defaultModels: string[];
  onChange: (models: string[]) => void;
  onFetch?: (type: string, key: string, baseUrl?: string) => Promise<{ success: boolean; models: string[]; message?: string }>;
}

export function ModelPicker({
  providerId,
  providerType,
  apiKey,
  baseUrl,
  selected,
  defaultModels,
  onChange,
  onFetch,
}: ModelPickerProps) {
  const [fetched, setFetched] = useState<string[] | null>(null);
  const [fetching, setFetching] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);

  const displayModels = fetched ?? defaultModels;

  useEffect(() => {
    if (selected.length === 0 && defaultModels.length > 0) {
      onChange(defaultModels);
    }
  }, []);

  async function handleFetch() {
    if (!apiKey || !onFetch) return;
    setFetching(true);
    setFetchError(null);
    try {
      const result = await onFetch(providerType, apiKey, baseUrl);
      if (result.success) {
        setFetched(result.models);
        onChange(result.models);
      } else {
        setFetched(result.models);
        onChange(result.models);
        setFetchError(result.message ?? "تعذر جلب النماذج");
      }
    } catch {
      setFetchError("تعذر الاتصال بالمزود");
    }
    setFetching(false);
  }

  function toggleModel(model: string) {
    if (selected.includes(model)) {
      onChange(selected.filter((m) => m !== model));
    } else {
      onChange([...selected, model]);
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium text-secondary-500">
          النماذج المتاحة ({selected.length}/{displayModels.length})
        </label>
        <button
          type="button"
          onClick={handleFetch}
          disabled={fetching || !apiKey}
          className="flex items-center gap-1.5 px-3 h-8 rounded-lg border border-neutral-200 text-xs text-portal-note-text hover:bg-neutral-50 disabled:opacity-40 transition-colors"
        >
          {fetching ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <RefreshCw className="w-3.5 h-3.5" />
          )}
          {fetching ? "جاري الجلب..." : 'جلب النماذج المتاحة'}
        </button>
      </div>

      {fetchError && (
        <div className="flex items-start gap-2 p-3 rounded-xl bg-alert-50 text-alert-700 text-xs">
          <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
          <span>{fetchError} — تم استخدام النماذج الافتراضية</span>
        </div>
      )}

      {displayModels.length === 0 ? (
        <p className="text-xs text-portal-note-text py-2">
          {apiKey ? 'اضغط "جلب النماذج المتاحة" لعرض النماذج' : "أدخل مفتاح API لجلب النماذج المتاحة"}
        </p>
      ) : (
        <div className={cn(
          "grid grid-cols-1 sm:grid-cols-2 gap-1.5 max-h-48 overflow-y-auto rounded-xl border border-neutral-200 p-2",
          fetched ? "bg-success-50/30" : "bg-badge-gray-bg/30",
        )}>
          {displayModels.map((model) => {
            const isSelected = selected.includes(model);
            return (
              <label
                key={model}
                className={cn(
                  "flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer transition-colors text-sm",
                  isSelected
                    ? "bg-secondary-50 text-secondary-700"
                    : "text-portal-note-text hover:bg-neutral-50",
                )}
              >
                <Checkbox
                  checked={isSelected}
                  onCheckedChange={() => toggleModel(model)}
                />
                <span className="truncate font-mono text-xs">{model}</span>
              </label>
            );
          })}
        </div>
      )}
    </div>
  );
}
