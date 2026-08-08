"use client";

import { useState } from "react";
import { PlusIcon } from "lucide-react";

import { PageScaffold } from "@/components/patterns/page-scaffold";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { EmployeeFormDialog } from "@/features/employees/components/employee-form-dialog";
import { EmployeesTable } from "@/features/employees/components/employees-table";
import type { EmployeeAdminRecord, EmployeeFormValues } from "@/features/employees/lib/employee-admin";
import {
  createInitialEmployeeAdminRecords,
  toEmployeeAdminRecord,
} from "@/features/employees/lib/employee-admin";

type DialogState =
  | { open: false; mode: "create"; employee?: undefined }
  | { open: true; mode: "create"; employee?: undefined }
  | { open: true; mode: "edit"; employee: EmployeeAdminRecord }
  | { open: false; mode: "edit"; employee?: EmployeeAdminRecord };

export function EmployeesWorkspace() {
  const [rows, setRows] = useState<EmployeeAdminRecord[]>(
    createInitialEmployeeAdminRecords
  );
  const [dialogState, setDialogState] = useState<DialogState>({
    open: false,
    mode: "create",
  });

  function handleCreate(values: EmployeeFormValues) {
    setRows((currentRows) => [toEmployeeAdminRecord(values), ...currentRows]);
  }

  function handleEdit(values: EmployeeFormValues) {
    if (!dialogState.employee) {
      return;
    }

    setRows((currentRows) =>
      currentRows.map((row) =>
        row.id === dialogState.employee?.id
          ? toEmployeeAdminRecord(values, row)
          : row
      )
    );
  }

  function handleSubmit(values: EmployeeFormValues) {
    if (dialogState.mode === "create") {
      handleCreate(values);
      return;
    }

    handleEdit(values);
  }

  function handleToggleSuspend(employeeId: string) {
    setRows((currentRows) =>
      currentRows.map((row) =>
        row.id === employeeId
          ? {
              ...row,
              isActive: !row.isActive,
              lastSeen: row.isActive ? row.lastSeen : "Just now",
            }
          : row
      )
    );
  }

  return (
    <>
      <PageScaffold
        title="Employees"
        description="Manage staff profiles, salaries, department assignment, and account state from one operational table."
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
              Admin-owned employee records with role, department, salary, and access state.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <EmployeesTable
              rows={rows}
              onEdit={(employee) =>
                setDialogState({ open: true, mode: "edit", employee })
              }
              onToggleSuspend={handleToggleSuspend}
            />
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
                }
          )
        }
        onSubmit={handleSubmit}
      />
    </>
  );
}
