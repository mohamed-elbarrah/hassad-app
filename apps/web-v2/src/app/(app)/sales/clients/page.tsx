import type { Metadata } from "next";

import { SalesClientsWorkspace } from "@/features/sales-clients/components/sales-clients-workspace";

export const metadata: Metadata = {
  title: "Sales Clients | Hassad",
};

export default function SalesClientsPage() {
  return <SalesClientsWorkspace />;
}
