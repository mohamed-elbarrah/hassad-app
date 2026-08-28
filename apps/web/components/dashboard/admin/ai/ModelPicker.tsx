"use client";

import { useState, useEffect, useMemo } from "react";
import { RefreshCw, AlertTriangle, Loader2, Search } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
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
  }, [defaultModels, onChange, selected.length]);

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
        setFetchError("تعذر جلب النماذج من المزود");
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
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-sm font-medium">
          النماذج المتاحة ({selected.length}/{displayModels.length})
        </h3>
        <Button type="button" variant="outline" size="sm" onClick={handleFetch} disabled={fetching || !apiKey}>
          {fetching ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <RefreshCw className="w-3.5 h-3.5" />
          )}
          {fetching ? "جاري الجلب..." : "جلب النماذج المتاحة"}
        </Button>
      </div>

      {fetchError && (
        <Alert variant="destructive">
          <AlertTriangle />
          <AlertDescription>{fetchError} — تم استخدام النماذج الافتراضية</AlertDescription>
        </Alert>
      )}

      {displayModels.length === 0 ? (
        <p className="py-2 text-xs text-muted-foreground">
          {apiKey
            ? 'اضغط "جلب النماذج المتاحة" لعرض النماذج'
            : "أدخل مفتاح API لجلب النماذج المتاحة"}
        </p>
      ) : (
        <div className="flex flex-col gap-2">
          <div className="relative">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
            <Input type="search" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="ابحث عن نموذج..." className="pr-10 text-right" aria-label="البحث عن نموذج" />
          </div>

          <div className="flex items-center gap-2">
            <Button type="button" variant="outline" size="sm" onClick={selectAllVisible}>
              تحديد الكل ({filteredModels.length})
            </Button>
            <Button type="button" variant="outline" size="sm" onClick={deselectAllVisible}>
              إلغاء تحديد الكل
            </Button>
            {search && (
              <span className="text-xs text-muted-foreground mr-auto">
                {filteredModels.length} من {displayModels.length}
              </span>
            )}
          </div>

          <div
            className={cn(
              "grid max-h-48 grid-cols-1 gap-1.5 overflow-y-auto rounded-xl border border-input p-2 sm:grid-cols-2",
              fetched ? "bg-muted/30" : "bg-muted/20",
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
                      ? "bg-secondary text-secondary-foreground"
                      : "text-muted-foreground hover:bg-muted",
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
              <p className="col-span-full py-4 text-center text-xs text-muted-foreground">
                لا توجد نماذج تطابق "{search}"
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
