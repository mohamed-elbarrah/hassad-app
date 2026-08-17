import type { Metadata } from "next";

import { ScreenPlaceholder } from "@/components/patterns/screen-placeholder";

export const metadata: Metadata = {
  title: "Admin Payments | Hassad",
};

export default function AdminPaymentsPage() {
  return <ScreenPlaceholder label="Admin Payments" />;
}
