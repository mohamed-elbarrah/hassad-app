"use client";

import { useEffect } from "react";

import { WorkspaceQueryState } from "@/components/patterns/workspace-query-state";

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return <WorkspaceQueryState kind="error" error={error} onRetry={reset} />;
}
