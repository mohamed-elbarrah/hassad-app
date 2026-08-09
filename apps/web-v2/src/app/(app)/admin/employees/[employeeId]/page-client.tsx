"use client";

import { PageScaffold } from "@/components/patterns/page-scaffold";
import { WorkspaceQueryState } from "@/components/patterns/workspace-query-state";
import { mapEmployeeDetailFromApi } from "@/features/admin-details/lib/detail-workspace-mappers";
import { EmployeeDetailWorkspace } from "@/features/employees/components/employee-detail-workspace";
import { useGetEmployeeDetailQuery } from "@/lib/api/admin-details-api";

export function EmployeeDetailPageClient({
  employeeId,
}: {
  employeeId: string;
}) {
  const { data, error, isError, isLoading, refetch } =
    useGetEmployeeDetailQuery(employeeId);

  if (isLoading && !data) {
    return (
      <PageScaffold
        title="Employee detail"
        description="Loading employee activity, workload, and assignments."
      >
        <WorkspaceQueryState kind="loading" loadingTitle="Loading employee detail" />
      </PageScaffold>
    );
  }

  if ((isError || !data) && !data) {
    return (
      <PageScaffold
        title="Employee detail"
        description="This workspace now reads directly from the backend."
      >
        <WorkspaceQueryState kind="error" error={error} onRetry={refetch} />
      </PageScaffold>
    );
  }

  const mapped = mapEmployeeDetailFromApi(data);

  return (
    <EmployeeDetailWorkspace
      employee={mapped.employee}
      adminRecord={mapped.adminRecord}
    />
  );
}
