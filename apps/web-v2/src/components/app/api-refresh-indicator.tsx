"use client";

import { LoaderCircleIcon } from "lucide-react";
import { useAppSelector } from "@/lib/store";
import { cn } from "@/lib/utils";

export function ApiRefreshIndicator() {
  const isFetching = useAppSelector((state) =>
    Object.values(state.api.queries).some((query) => query?.status === "pending"),
  );

  return (
    <div
      aria-live="polite"
      aria-label={isFetching ? "Refreshing data" : undefined}
      className={cn(
        "pointer-events-none fixed top-3 right-3 z-40 flex items-center gap-2 rounded-full bg-background px-3 py-1.5 text-xs text-muted-foreground opacity-0 shadow-sm ring-1 ring-foreground/10 transition-opacity",
        isFetching && "opacity-100",
      )}
    >
      <LoaderCircleIcon className="animate-spin" data-icon="inline-start" />
      Updating
    </div>
  );
}
