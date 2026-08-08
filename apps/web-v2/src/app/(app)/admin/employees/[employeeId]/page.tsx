import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { EmployeeDetailWorkspace } from "@/features/employees/components/employee-detail-workspace";
import { getInitialEmployeeAdminRecordById } from "@/features/employees/lib/employee-admin";
import { employees } from "@/lib/fixtures/first-slice";

type EmployeeDetailPageProps = {
  params: Promise<{
    employeeId: string;
  }>;
};

export async function generateMetadata({
  params,
}: EmployeeDetailPageProps): Promise<Metadata> {
  const { employeeId } = await params;
  const employee = employees.find((item) => item.id === employeeId);

  return {
    title: employee ? `${employee.name} | Hassad` : "Employee Detail | Hassad",
  };
}

export default async function EmployeeDetailPage({
  params,
}: EmployeeDetailPageProps) {
  const { employeeId } = await params;
  const employee = employees.find((item) => item.id === employeeId);
  const adminRecord = getInitialEmployeeAdminRecordById(employeeId);

  if (!employee || !adminRecord) {
    notFound();
  }

  return <EmployeeDetailWorkspace employee={employee} adminRecord={adminRecord} />;
}
