import { LoaderCircleIcon, RotateCcwIcon } from "lucide-react";

import { StateBlock } from "@/components/patterns/state-block";
import { Button } from "@/components/ui/button";
import { describeApiError } from "@/lib/api/describe-api-error";

type WorkspaceQueryStateProps = {
  kind: "loading" | "error";
  error?: Parameters<typeof describeApiError>[0];
  onRetry?: () => void;
  loadingTitle?: string;
  loadingDescription?: string;
  retryLabel?: string;
  errorTitle?: string;
  errorDescription?: string;
};

export function WorkspaceQueryState({
  kind,
  error,
  onRetry,
  loadingTitle = "Loading workspace",
  loadingDescription = "Waiting for the latest API response before rendering this page.",
  retryLabel = "Retry request",
  errorTitle,
  errorDescription,
}: WorkspaceQueryStateProps) {
  if (kind === "loading") {
    return (
      <StateBlock
        icon={<LoaderCircleIcon className="size-4 animate-spin" />}
        title={loadingTitle}
        description={loadingDescription}
      />
    );
  }

  const details = describeApiError(error);

  return (
    <StateBlock
      title={errorTitle ?? details.title}
      description={errorDescription ?? details.description}
      action={
        onRetry ? (
          <Button onClick={onRetry}>
            <RotateCcwIcon data-icon="inline-start" />
            {retryLabel}
          </Button>
        ) : undefined
      }
    />
  );
}
