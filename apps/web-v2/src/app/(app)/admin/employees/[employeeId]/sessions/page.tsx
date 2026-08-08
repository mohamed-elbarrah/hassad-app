import type { Metadata } from "next";

import { ScreenPlaceholder } from "@/components/patterns/screen-placeholder";

export const metadata: Metadata = {
  title: "Employee Sessions | Hassad",
};

export default function EmployeeSessionsPage() {
  return <ScreenPlaceholder label="Employee Sessions" />;
}
