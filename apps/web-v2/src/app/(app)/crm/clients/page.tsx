import type { Metadata } from "next";

import { CrmClientsWorkspace } from "@/features/crm-clients/components/crm-clients-workspace";

export const metadata: Metadata = {
  title: "CRM Clients | Hassad",
};

export default function CrmClientsPage() {
  return <CrmClientsWorkspace />;
}
