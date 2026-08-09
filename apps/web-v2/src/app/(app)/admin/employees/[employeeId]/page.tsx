import type { Metadata } from "next";
import { EmployeeDetailPageClient } from "./page-client";

type EmployeeDetailPageProps = {
  params: Promise<{
    employeeId: string;
  }>;
};

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: "Employee Detail | Hassad",
  };
}

export default async function EmployeeDetailPage({
  params,
}: EmployeeDetailPageProps) {
  const { employeeId } = await params;
  return <EmployeeDetailPageClient employeeId={employeeId} />;
}
