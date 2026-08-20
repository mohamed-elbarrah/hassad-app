"use client";

import { useState, useEffect, useMemo } from "react";
import { RefreshCw, AlertTriangle, Loader2, Search } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";

interface ModelPickerProps {
  providerType: string;
  apiKey: string;
  baseUrl?: string;
  selected: string[];
  defaultModels: string[];
  onChange: (models: string[]) => void;
  onFetch?: (
    type: string,
    key: string,
    baseUrl?: string,
  ) => Promise<{ success: boolean; models: string[]; message?: string }>;
}

export function ModelPicker({
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
  const [search, setSearch] = useState("");

  const displayModels = fetched ?? defaultModels;

  const filteredModels = useMemo(
    () =>
      displayModels.filter((m) =>
        m.toLowerCase().includes(search.toLowerCase()),
      ),
    [displayModels, search],
  );

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

  function selectAllVisible() {
    const toAdd = filteredModels.filter((m) => !selected.includes(m));
    if (toAdd.length === 0) return;
    onChange([...selected, ...toAdd]);
  }

  function deselectAllVisible() {
    const visibleSet = new Set(filteredModels);
    onChange(selected.filter((m) => !visibleSet.has(m)));
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
          {fetching ? "جاري الجلب..." : "جلب النماذج المتاحة"}
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
          {apiKey
            ? 'اضغط "جلب النماذج المتاحة" لعرض النماذج'
            : "أدخل مفتاح API لجلب النماذج المتاحة"}
        </p>
      ) : (
        <div className="space-y-2">
          <div className="relative">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-portal-note-text pointer-events-none" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="ابحث عن نموذج..."
              className="w-full h-10 pr-10 pl-4 text-sm text-secondary-500 bg-white border border-neutral-200 rounded-xl placeholder:text-neutral-200 focus:outline-none focus:border-secondary-500 focus:ring-1 focus:ring-secondary-500/20 transition-colors text-right"
            />
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={selectAllVisible}
              className="text-xs px-2.5 py-1 rounded-lg border border-neutral-200 text-portal-note-text hover:bg-neutral-50 transition-colors"
            >
              تحديد الكل ({filteredModels.length})
            </button>
            <button
              type="button"
              onClick={deselectAllVisible}
              className="text-xs px-2.5 py-1 rounded-lg border border-neutral-200 text-portal-note-text hover:bg-neutral-50 transition-colors"
            >
              إلغاء تحديد الكل
            </button>
            {search && (
              <span className="text-xs text-portal-note-text mr-auto">
                {filteredModels.length} من {displayModels.length}
              </span>
            )}
          </div>

          <div
            className={cn(
              "grid grid-cols-1 sm:grid-cols-2 gap-1.5 max-h-48 overflow-y-auto rounded-xl border border-neutral-200 p-2",
              fetched ? "bg-success-50/30" : "bg-badge-gray-bg/30",
            )}
          >
            {filteredModels.map((model) => {
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
            {filteredModels.length === 0 && search && (
              <p className="col-span-full text-xs text-portal-note-text text-center py-4">
                لا توجد نماذج تطابق "{search}"
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
