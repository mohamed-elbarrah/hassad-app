import type { Metadata } from "next";

import { CrmProposalsWorkspace } from "@/features/crm-proposals/components/crm-proposals-workspace";

export const metadata: Metadata = {
  title: "CRM Proposals | Hassad",
};

export default function CrmProposalsPage() {
  return <CrmProposalsWorkspace />;
}
