import type { Metadata } from "next";

import { ContractsWorkspace } from "@/features/crm-contracts/components/contracts-workspace";

export const metadata: Metadata = {
  title: "Contracts | Hassad",
};

export default function ContractsPage() {
  return <ContractsWorkspace />;
}
