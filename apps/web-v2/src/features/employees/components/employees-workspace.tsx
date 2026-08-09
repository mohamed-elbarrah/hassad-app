"use client";

import { useState } from "react";
import { PlusIcon } from "lucide-react";

import { PageScaffold } from "@/components/patterns/page-scaffold";
import { WorkspaceQueryState } from "@/components/patterns/workspace-query-state";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { EmployeeFormDialog } from "@/features/employees/components/employee-form-dialog";
import { EmployeesTable } from "@/features/employees/components/employees-table";
import type {
  EmployeeAdminRecord,
  EmployeeFormValues,
} from "@/features/employees/lib/employee-admin";
import {
  useCreateEmployeeMutation,
  useGetEmployeesWorkspaceQuery,
  useReactivateEmployeeMutation,
  useSuspendEmployeeMutation,
  useUpdateEmployeeMutation,
} from "@/lib/api/admin-workspaces-api";

type DialogState =
  | { open: false; mode: "create"; employee?: undefined }
  | { open: true; mode: "create"; employee?: undefined }
  | { open: true; mode: "edit"; employee: EmployeeAdminRecord }
  | { open: false; mode: "edit"; employee?: EmployeeAdminRecord };

export function EmployeesWorkspace() {
  const [dialogState, setDialogState] = useState<DialogState>({
    open: false,
    mode: "create",
  });
  const { data, error, isError, isLoading, refetch } = useGetEmployeesWorkspaceQuery({});
  const [createEmployee] = useCreateEmployeeMutation();
  const [updateEmployee] = useUpdateEmployeeMutation();
  const [suspendEmployee] = useSuspendEmployeeMutation();
  const [reactivateEmployee] = useReactivateEmployeeMutation();
  const rows = data?.items ?? [];

  async function handleSubmit(values: EmployeeFormValues) {
    if (dialogState.mode === "create") {
      await createEmployee(values);
      return;
    }

    if (dialogState.employee) {
      await updateEmployee({ id: dialogState.employee.id, values });
    }
  }

  async function handleToggleSuspend(employeeId: string) {
    const employee = rows.find((row) => row.id === employeeId);
    if (!employee) {
      return;
    }

    if (employee.isActive) {
      await suspendEmployee({
        id: employee.id,
        reason: "Suspended from employees workspace",
      });
      return;
    }

    await reactivateEmployee({
      id: employee.id,
      reason: "Reactivated from employees workspace",
    });
  }

  return (
    <>
      <PageScaffold
        title="Employees"
        description="Manage staff profiles, department assignment, and account state from one operational table."
        actions={
          <Button onClick={() => setDialogState({ open: true, mode: "create" })}>
            <PlusIcon data-icon="inline-start" />
            Add employee
          </Button>
        }
      >
        <Card>
          <CardHeader>
            <CardTitle>Employee directory</CardTitle>
            <CardDescription>
              Admin-owned employee records with role, department, and access state.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading && !data ? (
              <WorkspaceQueryState
                kind="loading"
                loadingTitle="Loading employees"
                loadingDescription="Retrieving the staff directory, roles, and account state from the admin API."
              />
            ) : isError && !data ? (
              <WorkspaceQueryState
                kind="error"
                error={error}
                onRetry={() => {
                  void refetch();
                }}
              />
            ) : (
              <EmployeesTable
                rows={rows}
                onEdit={(employee) =>
                  setDialogState({ open: true, mode: "edit", employee })
                }
                onToggleSuspend={(employeeId) => {
                  void handleToggleSuspend(employeeId);
                }}
              />
            )}
          </CardContent>
        </Card>
      </PageScaffold>

      <EmployeeFormDialog
        mode={dialogState.mode}
        employee={dialogState.mode === "edit" ? dialogState.employee : undefined}
        open={dialogState.open}
        onOpenChange={(open) =>
          setDialogState(
            open
              ? dialogState
              : {
                  open: false,
                  mode: "create",
                },
          )
        }
        onSubmit={handleSubmit}
      />
    </>
  );
}
