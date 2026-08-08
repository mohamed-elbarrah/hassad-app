import type { Metadata } from "next";

import { EmployeesWorkspace } from "@/features/employees/components/employees-workspace";

export const metadata: Metadata = {
  title: "Employees | Hassad",
};

export default function EmployeesPage() {
  return <EmployeesWorkspace />;
}
