import { WorkspaceQueryState } from "@/components/patterns/workspace-query-state";

export default function Loading() {
  return (
    <WorkspaceQueryState
      kind="loading"
      loadingTitle="Loading dispute detail"
      loadingDescription="Waiting for the PM dispute workspace and thread history."
    />
  );
}
