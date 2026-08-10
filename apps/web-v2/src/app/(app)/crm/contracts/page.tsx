import type { Metadata } from "next";

import { CrmContractsWorkspace } from "@/features/crm-contracts/components/crm-contracts-workspace";

export const metadata: Metadata = {
  title: "CRM Contracts | Hassad",
};

export default function CrmContractsPage() {
  return <CrmContractsWorkspace />;
}
