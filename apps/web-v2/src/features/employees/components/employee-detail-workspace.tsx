"use client";

import Link from "next/link";
import { useState } from "react";
import { ArrowLeftIcon, PencilIcon } from "lucide-react";

import { EntityDetailLayout } from "@/components/patterns/entity-detail-layout";
import { PageScaffold } from "@/components/patterns/page-scaffold";
import { StatusBadge } from "@/components/patterns/status-badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { EmployeeFixture } from "@/lib/fixtures/first-slice";
import type { EmployeeAdminRecord, EmployeeFormValues } from "@/features/employees/lib/employee-admin";
import {
  formatEmployeeSalary,
  getRoleLabel,
  toEmployeeAdminRecord,
} from "@/features/employees/lib/employee-admin";
import { EmployeeFormDialog } from "@/features/employees/components/employee-form-dialog";
import { EmployeeOperationalProfile } from "@/features/employees/components/employee-operational-profile";
import { getEmployeeDetailInsights } from "@/features/employees/lib/employee-detail-insights";

type EmployeeDetailWorkspaceProps = {
  employee: EmployeeFixture;
  adminRecord: EmployeeAdminRecord;
};

const sidebarSummaryCopy: Record<EmployeeFixture["role"], { title: string; description: string }> = {
  ADMIN: {
    title: "Admin summary",
    description: "Compact operating signals for this admin seat.",
  },
  PM: {
    title: "Delivery summary",
    description: "Compact operating signals that support the delivery view.",
  },
  SALES: {
    title: "Sales summary",
    description: "Compact pipeline and follow-up signals for this sales role.",
  },
  TEAM: {
    title: "Execution summary",
    description: "Compact output and blocker signals for daily execution.",
  },
  MARKETING: {
    title: "Campaign summary",
    description: "Compact campaign signals for launch and performance follow-up.",
  },
  ACCOUNTANT: {
    title: "Finance summary",
    description: "Compact finance signals for queues, payments, and exceptions.",
  },
  CLIENT: {
    title: "Client summary",
    description: "Compact engagement signals for this client-side account.",
  },
};

export function EmployeeDetailWorkspace({
  employee,
  adminRecord,
}: EmployeeDetailWorkspaceProps) {
  const [record, setRecord] = useState(adminRecord);
  const [dialogOpen, setDialogOpen] = useState(false);
  const insights = getEmployeeDetailInsights(employee);
  const sidebarCopy = sidebarSummaryCopy[employee.role];

  function handleSubmit(values: EmployeeFormValues) {
    setRecord((current) => toEmployeeAdminRecord(values, current));
  }

  return (
    <>
      <PageScaffold
        title="Employee detail"
        description="Performance, workload, risk, and the activity that matters for admin decisions."
        actions={
          <Button
            variant="outline"
            nativeButton={false}
            render={<Link href="/admin/employees" />}
          >
            <ArrowLeftIcon data-icon="inline-start" />
            Employees
          </Button>
        }
      >
        <EntityDetailLayout
          sidebar={
            <>
              <Card>
                <CardHeader className="gap-4">
                  <div className="flex items-start gap-4">
                    <Avatar size="lg">
                      <AvatarFallback>{record.initials}</AvatarFallback>
                    </Avatar>
                    <div className="flex min-w-0 flex-1 flex-col gap-2">
                      <div className="flex flex-col gap-1">
                        <CardTitle className="truncate text-2xl">{record.name}</CardTitle>
                        <CardDescription>{getRoleLabel(record.role)}</CardDescription>
                        <p className="text-sm text-muted-foreground">{record.email}</p>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <StatusBadge tone={record.isActive ? "success" : "destructive"}>
                          {record.isActive ? "Active" : "Suspended"}
                        </StatusBadge>
                        <StatusBadge tone={employee.riskTone}>{employee.riskLabel}</StatusBadge>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="flex flex-col gap-3">
                  <Button onClick={() => setDialogOpen(true)}>
                    <PencilIcon data-icon="inline-start" />
                    Edit employee
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>About</CardTitle>
                  <CardDescription>
                    Identity, team, and admin details that stay stable across tabs.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <dl className="flex flex-col gap-4 text-sm">
                    <div className="flex items-start justify-between gap-4">
                      <dt className="text-muted-foreground">Team</dt>
                      <dd className="text-right font-medium">{employee.department}</dd>
                    </div>
                    <div className="flex items-start justify-between gap-4">
                      <dt className="text-muted-foreground">Start date</dt>
                      <dd className="text-right font-medium">{record.startDate}</dd>
                    </div>
                    <div className="flex items-start justify-between gap-4">
                      <dt className="text-muted-foreground">Salary</dt>
                      <dd className="text-right font-medium">
                        {formatEmployeeSalary(record.salary)}
                      </dd>
                    </div>
                    <div className="flex items-start justify-between gap-4">
                      <dt className="text-muted-foreground">Last activity</dt>
                      <dd className="text-right font-medium">{employee.lastActivity}</dd>
                    </div>
                  </dl>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>{sidebarCopy.title}</CardTitle>
                  <CardDescription>{sidebarCopy.description}</CardDescription>
                </CardHeader>
                <CardContent className="flex flex-col gap-3">
                  {insights.summary.map((item) => (
                    <div
                      key={item.label}
                      className="flex items-start justify-between gap-4"
                    >
                      <div className="flex flex-col gap-1">
                        <span className="text-sm text-muted-foreground">{item.label}</span>
                        <span className="text-xs text-muted-foreground">{item.helper}</span>
                      </div>
                      <span className="text-right font-medium">{item.value}</span>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </>
          }
        >
          <EmployeeOperationalProfile employee={employee} />
        </EntityDetailLayout>
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
