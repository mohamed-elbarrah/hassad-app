"use client";

import Link from "next/link";
import { useState } from "react";
import { ArrowLeftIcon, PencilIcon } from "lucide-react";

import { DetailHero } from "@/components/patterns/detail-hero";
import { PageScaffold } from "@/components/patterns/page-scaffold";
import { StatusBadge } from "@/components/patterns/status-badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import type { EmployeeFixture } from "@/lib/fixtures/first-slice";
import type { EmployeeAdminRecord, EmployeeFormValues } from "@/features/employees/lib/employee-admin";
import {
  formatEmployeeSalary,
  getDepartmentLabel,
  getRoleLabel,
  toEmployeeAdminRecord,
} from "@/features/employees/lib/employee-admin";
import { EmployeeFormDialog } from "@/features/employees/components/employee-form-dialog";
import { EmployeeOperationalProfile } from "@/features/employees/components/employee-operational-profile";

type EmployeeDetailWorkspaceProps = {
  employee: EmployeeFixture;
  adminRecord: EmployeeAdminRecord;
};

export function EmployeeDetailWorkspace({
  employee,
  adminRecord,
}: EmployeeDetailWorkspaceProps) {
  const [record, setRecord] = useState(adminRecord);
  const [dialogOpen, setDialogOpen] = useState(false);

  function handleSubmit(values: EmployeeFormValues) {
    setRecord((current) => toEmployeeAdminRecord(values, current));
  }

  return (
    <>
      <PageScaffold
        title="Employee detail"
        description="Performance, workload, risk, and the activity that matters for admin decisions."
        actions={
          <>
            <Button
              variant="outline"
              nativeButton={false}
              render={<Link href="/admin/employees" />}
            >
              <ArrowLeftIcon data-icon="inline-start" />
              Employees
            </Button>
            <Button onClick={() => setDialogOpen(true)}>
              <PencilIcon data-icon="inline-start" />
              Edit employee
            </Button>
          </>
        }
      >
        <DetailHero
          title={record.name}
          description={employee.headlineSignal}
          media={
            <Avatar size="lg">
              <AvatarFallback>{record.initials}</AvatarFallback>
            </Avatar>
          }
          badges={
            <>
              <StatusBadge tone={record.isActive ? "success" : "destructive"}>
                {record.isActive ? "Active" : "Suspended"}
              </StatusBadge>
              <StatusBadge tone={employee.riskTone}>{employee.riskLabel}</StatusBadge>
            </>
          }
          metadata={[
            { label: "Role", value: getRoleLabel(record.role) },
            { label: "Team", value: getDepartmentLabel(record.department) },
            { label: "Current load", value: employee.workload },
            { label: "Last activity", value: employee.lastActivity },
            { label: "Salary", value: formatEmployeeSalary(record.salary) },
          ]}
          aside={
            <div className="flex h-full flex-col gap-4">
              <div className="flex flex-col gap-1">
                <span className="text-sm text-muted-foreground">Performance signal</span>
                <span className="text-xl font-semibold tracking-tight">
                  {employee.performanceSignal}
                </span>
                <span className="text-sm text-muted-foreground">
                  {employee.roleProfile.summary}
                </span>
              </div>
              <dl className="grid gap-3 text-sm">
                <div className="flex items-center justify-between gap-3">
                  <dt className="text-muted-foreground">State</dt>
                  <dd>
                    <StatusBadge tone={record.isActive ? "success" : "destructive"}>
                      {record.isActive ? "Active" : "Suspended"}
                    </StatusBadge>
                  </dd>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <dt className="text-muted-foreground">Open work</dt>
                  <dd className="font-medium">{employee.openAssignments}</dd>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <dt className="text-muted-foreground">Priority watch</dt>
                  <dd>
                    <StatusBadge tone={employee.riskTone}>{employee.riskLabel}</StatusBadge>
                  </dd>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <dt className="text-muted-foreground">Start date</dt>
                  <dd className="font-medium">{record.startDate}</dd>
                </div>
              </dl>
            </div>
          }
        />

        <EmployeeOperationalProfile employee={employee} />
      </PageScaffold>

      <EmployeeFormDialog
        mode="edit"
        employee={record}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onSubmit={handleSubmit}
      />
    </>
  );
}
