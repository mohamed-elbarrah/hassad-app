import type { Metadata } from "next";

import { ScreenPlaceholder } from "@/components/patterns/screen-placeholder";

export const metadata: Metadata = {
  title: "Employee Activity | Hassad",
};

export default function EmployeeActivityPage() {
  return <ScreenPlaceholder label="Employee Activity" />;
}
