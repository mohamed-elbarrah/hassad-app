import type { Metadata } from "next";

import { ScreenPlaceholder } from "@/components/patterns/screen-placeholder";

export const metadata: Metadata = {
  title: "Admin Invoices | Hassad",
};

export default function AdminInvoicesPage() {
  return <ScreenPlaceholder label="Admin Invoices" />;
}
