import type { Metadata } from "next";

import { CrmOverviewWorkspace } from "@/features/crm-overview/components/crm-overview-workspace";

export const metadata: Metadata = {
  title: "CRM Overview | Hassad",
};

export default function CrmPage() {
  return <CrmOverviewWorkspace />;
}
