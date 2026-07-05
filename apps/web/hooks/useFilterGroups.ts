import { useMemo } from "react";
import type {
  FilterGroup,
  FilterOption,
} from "@/components/design-system/FilterBar";

/**
 * Build a single-key filter group whose options are derived from
 * the items actually present in the data, ordered by `preference`
 * (with any remaining statuses appended in their first-seen order).
 *
 * Used by every portal queue toolbar so they don't each reimplement
 * the same status-counter → FilterGroup pipeline.
 */
export function useFilterGroups<T>(
  items: T[] | undefined,
  options: {
    key: string;
    label: string;
    /** Property on T that holds the status string. */
    pick: (item: T) => string | null | undefined;
    /** Display label map, keyed by the same string `pick` returns. */
    labelMap: Record<string, string>;
    /** Preferred option order (e.g. ACTIVE before COMPLETED). */
    preference?: readonly string[];
  },
): FilterGroup[] {
  return useMemo(() => {
    const counts = new Map<string, number>();
    for (const item of items ?? []) {
      const value = options.pick(item);
      if (!value) continue;
      counts.set(value, (counts.get(value) ?? 0) + 1);
    }

    const seen = new Set<string>();
    const result: FilterOption[] = [{ label: "الكل", value: "" }];

    for (const value of options.preference ?? []) {
      if (counts.has(value)) {
        result.push({
          label: options.labelMap[value] ?? value,
          value,
          count: counts.get(value) ?? 0,
        });
        seen.add(value);
      }
    }
    // Catch-all for statuses that exist in data but weren't in
    // the preference list — keeps the UI correct if the API grows.
    for (const [value, count] of counts) {
      if (seen.has(value)) continue;
      result.push({
        label: options.labelMap[value] ?? value,
        value,
        count,
      });
    }

    return [
      {
        key: options.key,
        label: options.label,
        options: result,
      },
    ];
  }, [items, options]);
}
