import type { Metadata } from "next";

import { ClientsWorkspace } from "@/features/clients/components/clients-workspace";

export const metadata: Metadata = {
  title: "Clients | Hassad",
};

export default function ClientsPage() {
  return <ClientsWorkspace />;
}
