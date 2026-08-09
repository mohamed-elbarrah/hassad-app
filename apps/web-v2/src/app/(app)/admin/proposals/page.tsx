import type { Metadata } from "next";

import { ProposalsWorkspace } from "@/features/crm-proposals/components/proposals-workspace";

export const metadata: Metadata = {
  title: "Proposals | Hassad",
};

export default function ProposalsPage() {
  return <ProposalsWorkspace />;
}
