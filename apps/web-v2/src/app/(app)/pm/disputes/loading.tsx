import { WorkspaceQueryState } from "@/components/patterns/workspace-query-state";

export default function Loading() {
  return (
    <WorkspaceQueryState
      kind="loading"
      loadingTitle="Loading PM disputes"
      loadingDescription="Waiting for the dispute queue and summary stats."
    />
  );
}
